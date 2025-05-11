import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import EmailVerification from "../models/EmailVerification.js";
import fetch from "node-fetch";
import sodium from "libsodium-wrappers";
import axios from "axios";
import { google } from "googleapis";
import { Octokit } from "@octokit/rest";
import Stripe from "stripe";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

export const sendEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(404).json({ message: "Your Account Already Exists" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }

  try {
    let verificationEntry = await EmailVerification.findOne({ email });
    let code;
    if (verificationEntry) {
      code = verificationEntry.verification_code;
    } else {
      code = Math.floor(100000 + Math.random() * 900000);
      const newVerification = new EmailVerification({ email, verification_code: code });
      await newVerification.save();
    }

    const accessToken = await oauth2Client.getAccessToken();
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    let mailOptions = {
      from: process.env.GMAIL,
      to: email,
      subject: "[" + code + "] " + "YourWay Two-Factor Authentication Code",
      html: `
        <div style="background-color: #5e5e5e; color: white; padding: 20px; text-align: center;">
          <img src="https://res.cloudinary.com/djdyalgim/image/upload/v1728130531/qahrrkf2q4l6xbpl05un.png" alt="Your Way Logo" style="max-width: 200px;" />
          <h1>Your Way Two-Factor Authentication Code</h1>
          <p>Dear User,</p>
          <p>Your two-factor authentication code is: <strong>${code}</strong></p>
          <p>Please enter this code to verify your account.</p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <p>Best regards,<br>Your Way Team</p>
        </div> 
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(400).json({ message: error.message });
      } else {
        return res.status(200).json({ message: "Verification email sent to your account" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required" });
  }

  try {
    const verificationEntry = await EmailVerification.findOne({ email, verification_code: code });

    if (verificationEntry) {
      await EmailVerification.deleteOne({ email });
      return res.status(200).json({ message: "Email verified successfully!" });
    } else {
      return res.status(400).json({ message: "Invalid email or verification code" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const forkRepo = async (repoName, buildName, accessToken) => {
  const response = await fetch(`https://api.github.com/repos/YourWayApps/${repoName}/forks`, {
    method: "POST",
    headers: {
      Authorization: `token ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organization: "YourWayApps",
      name: `${repoName}-${buildName}`,
    }),
  });

  const data = await response.json();

  if (response.ok) {
    return { success: true, forkUrl: data.html_url, repoName: data.name, repoId: data.id };
  } else {
    throw new Error(data.message);
  }
};

const addSecrets = async (repoName, secrets, accessToken) => {
  await sodium.ready;

  for (const [secretName, secretValue] of Object.entries(secrets)) {
    const publicKeyResponse = await fetch(
      `https://api.github.com/repos/YourWayApps/${repoName}/actions/secrets/public-key`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!publicKeyResponse.ok) {
      const errorData = await publicKeyResponse.json();
      throw new Error(`Failed to fetch public key: ${errorData.message}`);
    }

    const { key, key_id } = await publicKeyResponse.json();

    const publicKeyBuffer = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    const secretBuffer = sodium.from_string(secretValue);
    const encryptedBytes = sodium.crypto_box_seal(secretBuffer, publicKeyBuffer);
    const encryptedSecretValue = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);

    const addSecretResponse = await fetch(
      `https://api.github.com/repos/YourWayApps/${repoName}/actions/secrets/${secretName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          encrypted_value: encryptedSecretValue,
          key_id: key_id,
        }),
      }
    );

    if (!addSecretResponse.ok) {
      const errorData = await addSecretResponse.json();
      throw new Error(`Failed to add secret: ${errorData.message}`);
    }
  }
};

const createWorkflow = async (repoName, accessToken, buildName) => {
  const netlifyResponse = await fetch("https://api.netlify.com/api/v1/sites", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${repoName.toLowerCase()}-${Date.now()}`,
    }),
  });

  if (!netlifyResponse.ok) {
    const errorData = await netlifyResponse.json();
    throw new Error(`Netlify site creation failed: ${errorData.message}`);
  }

  const netlifyData = await netlifyResponse.json();
  const siteId = netlifyData.id;
  const siteUrl = netlifyData.url;
  await addSecrets(repoName, { NETLIFY_SITE_ID: siteId }, accessToken);

  const workflow1 = `name: Delete Build from Netlify

on:
  workflow_dispatch:

jobs:
  delete:
    runs-on: ubuntu-latest

    steps:
    - name: Delete Netlify Site
      run: |
        curl -X DELETE https://api.netlify.com/api/v1/sites/\${{ secrets.NETLIFY_SITE_ID }} \\
        -H "Authorization: Bearer \${{ secrets.NETLIFY_AUTH_TOKEN }}"
`;

  const workflowContent = `name: Build and Deploy to Netlify

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '20'

    - name: Install dependencies
      run: |
        npm install

    - name: Build Expo App
      run: |
        npx expo export

    - name: Install Netlify CLI
      run: |
        npm install -g netlify-cli

    - name: Deploy to Netlify
      env:
        NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
      run: |
        netlify deploy --prod --dir=./dist --site=$NETLIFY_SITE_ID
`;

  const workflow1Encoded = Buffer.from(workflow1).toString("base64");
  const contentEncoded = Buffer.from(workflowContent).toString("base64");

  const createFile = async (filename, contentEncoded, message) => {
    const response = await fetch(
      `https://api.github.com/repos/YourWayApps/${repoName}/contents/.github/workflows/${filename}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          content: contentEncoded,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Error creating workflow '${filename}': ${data.message}`);
    }
  };

  await createFile("delete.yml", workflow1Encoded, "Delete Netlify site");
  await createFile("deploy.yml", contentEncoded, "Deploy to Netlify");

  return { siteId, siteUrl };
};

export const registerUser = async (req, res) => {
  const { name, email, password, phone, businessName, businessAddress } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const currentDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(currentDate.getDate() + 3);

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      address: {
        line1: businessAddress.street,
        city: businessAddress.city,
        state: businessAddress.state,
        postal_code: businessAddress.zipCode,
        country: businessAddress.country,
      },
    });

    // Create subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }], // Set PRICE_ID in .env
      trial_period_days: 3,
      payment_behavior: "default_incomplete",
      trial_settings: { end_behavior: { missing_payment_method: "pause" } },
      expand: ["latest_invoice.payment_intent"],
    });

    const buildName = businessName.replace(/\s+/g, "-");
    const repoName = process.env.NEXT_PUBLIC_REPO_NAME;
    const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const netlifyAuthToken = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;

    const restaurantPayload = {
      name: businessName,
      description: `${businessName}`,
      theme: "0",
      address: `${businessAddress.street}, ${businessAddress.city}, ${businessAddress.state}, ${businessAddress.zipCode}, ${businessAddress.country}`,
      bannerImages: [],
      bestSellers: [],
    };

    const { data: newRestaurant } = await axios.post(
      `${process.env.APP_BASE_URL}/api/restaurant`,
      restaurantPayload
    );

    const forkResult = await forkRepo(repoName, buildName, githubToken);

    await addSecrets(forkResult.repoName, { NETLIFY_AUTH_TOKEN: netlifyAuthToken }, githubToken);

    const octokit = new Octokit({
      auth: githubToken,
    });

    const fileContent = `const RestaurantID = "${newRestaurant._id}";
export const BASE_URL = 'https://api.fastnfresh.app/chai';
export const RESTAURANT_URL = \`/api/restaurant/\${RestaurantID}\`;
export const PRODUCTS_URL = \`/api/restaurant/\${RestaurantID}/products\`;
export const AUTH_URL = \`/api/restaurant/\${RestaurantID}/users\`;
export const ORDER_URL = \`/api/restaurant/\${RestaurantID}/orders\`;
export const FEEDBACK_URL = \`/api/restaurant/\${RestaurantID}/feedback\`;
`;

    const { data: fileData } = await octokit.repos.getContent({
      owner: "YourWayApps",
      repo: forkResult.repoName,
      path: "constants.js",
    });

    const sha = fileData.sha;
    const updateResponse = await octokit.repos.createOrUpdateFileContents({
      owner: "YourWayApps",
      repo: forkResult.repoName,
      path: "constants.js",
      message: `Update RestaurantID in constants.js`,
      content: Buffer.from(fileContent).toString("base64"),
      sha: sha,
    });

    if (updateResponse.status !== 200) {
      throw new Error("Failed to update constants.js");
    }

    const { siteId, siteUrl } = await createWorkflow(forkResult.repoName, githubToken, buildName);

    const user = new User({
      name,
      email,
      passwordHash,
      phone,
      businessName,
      businessAddress: {
        street: businessAddress.street,
        city: businessAddress.city,
        state: businessAddress.state,
        zipCode: businessAddress.zipCode,
        country: businessAddress.country,
      },
      subscriptionPlan: "trial",
      subscriptionStartDate: currentDate,
      subscriptionEndDate: subscriptionEndDate,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      repoLink: `https://github.com/YourWayApps/${forkResult.repoName}`,
      buildUrl: siteUrl,
      siteID: siteId,
      restaurantID: newRestaurant._id,
    });

    await user.save();

    const token = user.generateAuthToken();

    res.status(201).json({
      message: "User registered successfully",
      token,
      githubRepo: user.repoLink,
      buildUrl: user.buildUrl,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// New function to create checkout session
export const createCheckoutSession = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_BASE_URL}/cancel`,
      subscription_data: {
        trial_period_days: user.subscriptionPlan === "trial" ? 3 : 0,
        trial_settings: { end_behavior: { missing_payment_method: "pause" } },
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// New function to handle Stripe webhooks
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created":
      const subscription = event.data.object;
      const user = await User.findOne({ stripeSubscriptionId: subscription.id });
      if (user) {
        await User.findByIdAndUpdate(user._id, {
          subscriptionPlan: subscription.status === "active" ? "active" : subscription.status,
          subscriptionStartDate: new Date(subscription.current_period_start * 1000),
          subscriptionEndDate: new Date(subscription.current_period_end * 1000),
          isActive: subscription.status === "active" || subscription.status === "trialing",
        });
      }
      break;
    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object;
      const deletedUser = await User.findOne({ stripeSubscriptionId: deletedSubscription.id });
      if (deletedUser) {
        await User.findByIdAndUpdate(deletedUser._id, {
          subscriptionPlan: "canceled",
          isActive: false,
        });
      }
      break;
    case "invoice.payment_failed":
      const invoice = event.data.object;
      const failedUser = await User.findOne({ stripeCustomerId: invoice.customer });
      if (failedUser) {
        // Optionally notify user to update payment method
        console.log(`Payment failed for user ${failedUser.email}`);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

// Existing functions remain unchanged
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = user.generateAuthToken();

    res.cookie("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      message: "Logged in successfully",
      token,
      restaurantID: user.restaurantID,
      buildUrl: user.buildUrl,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select("-passwordHash");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getDeactivatedUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: false }).select("-passwordHash");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, businessName, businessAddress, subscriptionPlan } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, phone, businessName, businessAddress, subscriptionPlan },
      { new: true, runValidators: true, select: "-passwordHash" }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const DeActivateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deactivated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};