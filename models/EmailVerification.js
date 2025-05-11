import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  verification_code: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '10m'
  }
});

const emailVerification = mongoose.model('EmailVerification', emailVerificationSchema);
export default emailVerification;