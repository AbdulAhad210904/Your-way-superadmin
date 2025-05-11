import express from "express";
import { registerUser, loginUser, logoutUser,  getAllUsers, getUserById, updateUser, deleteUser,sendEmail,verifyCode, DeActivateUser, createCheckoutSession, handleWebhook } from "../controllers/userController.js";
import Validate from "../middleware/validate.js"; 
import { check } from "express-validator";
import authMiddleware from "../middleware/authMiddleware .js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/send-mail",Validate, sendEmail);
router.post("/verify-code",Validate, verifyCode);

router.post(
  "/register",
  [
    check("name", "Name is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required and must be 6 or more characters").isLength({ min: 6 }),
    check("phone", "Phone number is required").notEmpty(),
    check("businessName", "Business name is required").notEmpty(),
  ],
  Validate,
  registerUser
);

router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").notEmpty(),
  ],
  Validate,
  loginUser
);

router.get("/logout", logoutUser);

router.get("/getallusers",authMiddleware,roleMiddleware(['admin', 'super-admin']), getAllUsers);

router.get(
  "/getuser/:id",
  [
    check("id", "Invalid user ID").isMongoId(), // Validate that ID is a valid MongoDB ObjectId
  ],
  Validate,
  getUserById
);

router.put(
  "/updateuser/:id",
  [
    check("id", "Invalid user ID").isMongoId(), 
    check("name", "Name is required").optional().notEmpty(),
    check("email", "Please include a valid email").optional().isEmail(),
    check("phone", "Phone number is required").optional().notEmpty(),
    check("businessName", "Business name is required").optional().notEmpty(),
  ],
  Validate,
  authMiddleware,roleMiddleware(['admin', 'super-admin']),
  updateUser
);

router.delete(
  "/deleteuser/:id",
  [
    check("id", "Invalid user ID").isMongoId(),
  ],
  Validate,
  authMiddleware,roleMiddleware(['admin', 'super-admin']),
  deleteUser
);

router.put(
  "/deactivateuser/:id",
  [
    check("id", "Invalid user ID").isMongoId(),
  ],
  Validate,
  authMiddleware,roleMiddleware(['admin', 'super-admin']),
  DeActivateUser
);
router.post(
  "/create-checkout-session",
  [
    check("userId", "Invalid user ID").isMongoId(),
  ],
  Validate,
  authMiddleware,
  createCheckoutSession
);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // Raw body for webhook
  handleWebhook
);
export default router;
