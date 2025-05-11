import AdminUser from "../models/AdminUser.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await AdminUser.findOne({ email }).select("+passwordHash");
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = admin.generateAuthToken();
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Logged in successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const logoutAdmin = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};

export const getAllAdminUsers = async (req, res) => {
  try {
    const admins = await AdminUser.find().select("-passwordHash");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAdminUserById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }
  try {
    const admin = await AdminUser.findById(id).select("-passwordHash");
    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createAdminUser = async (req, res) => {
  const { name, email, password, role: newRole } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = new AdminUser({
      name,
      email,
      passwordHash,
      role: newRole || "admin",
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin user created successfully", newAdmin });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateAdminUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role: updatedRole } = req.body;

  try {
    const updatedFields = { name, email, role: updatedRole };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedFields.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedAdmin = await AdminUser.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    res.status(200).json({ message: "Admin user updated successfully", updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAdmin = await AdminUser.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    res.status(200).json({ message: "Admin user deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
