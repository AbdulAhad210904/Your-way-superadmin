import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: "Your name is required",
      max: 50,
    },
    email: {
      type: String,
      required: "Your email is required",
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: "Your password is required",
      select: false,
    },
    phone: {
      type: String,
      required: "Your phone number is required",
    },
    businessName: {
      type: String,
      required: "Your business name is required",
    },
    subscriptionPlan: {
      type: String,
    },
    subscriptionStartDate: {
      type: Date,
    },
    subscriptionEndDate: {
      type: Date,
    },
    stripeCustomerId: { type: String }, // New field for Stripe customer ID
    stripeSubscriptionId: { type: String }, // New field for Stripe subscription ID
    businessAddress: {
      street: {
        type: String,
        required: "Street is required",
      },
      city: {
        type: String,
        required: "City is required",
      },
      state: {
        type: String,
        required: "State is required",
      },
      zipCode: {
        type: String,
        required: "Zip code is required",
      },
      country: {
        type: String,
        required: "Country is required",
      },
    },
    isActive: {
      type: Boolean,
      default: true, // Users are active by default
    },
    repoLink: {
      type: String,
      required: "Repository link is required",
    },
    buildUrl: {
      type: String,
      required: "Build URL is required",
    },
    restaurantID:{
      type: String
    },
    siteID:{
      type: String
    }
  },
  { timestamps: true }
);

// method to sign the user id with secret key and generates a token
UserSchema.methods.generateAuthToken = function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return token;
};

export default mongoose.model("User", UserSchema);
