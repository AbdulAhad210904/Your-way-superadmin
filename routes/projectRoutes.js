import express from "express";
import Validate from "../middleware/validate.js";
import { check } from "express-validator";
import { createProject, getProjects, getProjectByProjectId, getProjectByUserId, updateProject, deleteProject } from "../controllers/projectController.js";
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.post(
    "/createproject",
    upload.fields([{ name: 'projectImage' }, { name: 'projectLogo' }]),
    [
        check("userId", "User ID is required").notEmpty(),
        check("title", "Title is required").notEmpty(),
        check("description", "Description is required").notEmpty(),
        check("link", "Project link is required").notEmpty(),
    ],
    Validate,
    createProject
);

router.get("/getprojects", Validate, getProjects);

router.get(
    "/getproject/:id",
    [
        check("id", "Invalid project ID").isMongoId(),
    ],
    Validate,
    getProjectByProjectId
);

router.get(
    "/getprojectbyuserid/:userId",
    [
        check("userId", "Invalid user ID").isMongoId(),
    ],
    Validate,
    getProjectByUserId
);

router.put(
    "/updateproject/:id",
    [
        check("id", "Invalid project ID").isMongoId(),
        check("userId", "User ID is required").optional().notEmpty(),
        check("title", "Title is required").optional().notEmpty(),
        check("description", "Description is required").optional().notEmpty(),
        check("projectImage", "projectImage is required").optional().notEmpty(),
        check("projectLogo", "projectLogo is required").optional().notEmpty(),
        check("link", "projectLink is required").optional().notEmpty(),
    ],
    Validate,
    updateProject
);

router.delete(
    "/deleteproject/:id",
    [
        check("id", "Invalid project ID").isMongoId(),
    ],
    Validate,
    deleteProject
);

export default router;