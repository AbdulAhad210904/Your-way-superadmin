import express from "express";
import {
  loginAdmin,
  logoutAdmin,
  getAllAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "../controllers/adminUserController.js";
import authMiddleware from "../middleware/authMiddleware .js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { check } from "express-validator";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

router.post("/admin-login",
    [
        check("email", "Please include a valid email").isEmail(),
        check("password", "Password is required").notEmpty(),
    ],
    loginAdmin);
router.post("/admin-logout", authMiddleware, logoutAdmin);

// Protected routes
router.get("/get-admin-users", authMiddleware, roleMiddleware(['super-admin']), getAllAdminUsers);
router.get("/get-admin-user/:id",[check("id", "Invalid user ID").isMongoId(),], authMiddleware, roleMiddleware(['super-admin']), getAdminUserById);

router.post("/create-admin-user",
    [
    check("name", "Name is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required and must be 6 or more characters").isLength({ min: 6 }),
    check("role", "Role must be either 'admin' or 'super-admin'").optional().isIn(["admin", "super-admin"]),
   ],
   authMiddleware, roleMiddleware(['super-admin']), createAdminUser);

//create a route to craete a super admin role user having name, email, password and role without any middleware
router.post("/create-super-admin-user",
    [
        check("name", "Name is required").notEmpty(),
        check("email", "Please include a valid email").isEmail(),
        check("password", "Password is required and must be 6 or more characters").isLength({ min: 6 }),
        check("role", "Role must be either 'admin' or 'super-admin'").optional().isIn(["admin", "super-admin"]),
    ],
    createAdminUser);

router.put("/update-admin-user/:id",
    [
        check("id", "Invalid ID format").isMongoId(),
        check("name", "Name is required").optional().notEmpty(),
        check("email", "Please include a valid email").optional().isEmail(),
        check("password", "Password must be 6 or more characters").optional().isLength({ min: 6 }),
        check("role", "Role must be either 'admin' or 'super-admin'").optional().isIn(["admin", "super-admin"]),
    ],
    authMiddleware, roleMiddleware(['super-admin']), updateAdminUser);

router.delete("/delete-admin-user/:id",[check("id", "Invalid user ID").isMongoId(),], authMiddleware, roleMiddleware(['super-admin']), deleteAdminUser);

export default router;

