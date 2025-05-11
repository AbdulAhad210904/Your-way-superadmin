import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const AdminUserSchema = new mongoose.Schema(
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
        role: {
        type: String,
        enum: ['admin', 'super-admin'],
        default: 'admin',
        required: true,
        },
    },
    { timestamps: true }
    );

//generate suth token for admin using role and id
AdminUserSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET,{
        expiresIn: "7d",
    });
    return token
};

export default mongoose.model("AdminUser", AdminUserSchema);