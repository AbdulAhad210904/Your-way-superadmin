import express from "express";
import { check } from "express-validator";
import Validate from "../middleware/validate.js";
import {
    createBlog,
    getBlogs,
    getBlogById,
    getBlogBySeoId,
    updateBlog,
    deleteBlog
} from "../controllers/blogController.js";
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.post(
  '/createblog',
  upload.single('blogImage'),
  [
    check('title', 'Title is required').notEmpty(),
    check('description', 'Description is required').notEmpty(),
    check('body', 'Body is required').notEmpty(),
    check('seoId', 'SEO ID is required').notEmpty()
  ],
  Validate,
  createBlog
);

router.get("/getblogs", Validate, getBlogs);

router.get(
    "/getblog/:id",
    [
        check("id", "Invalid blog ID").isMongoId(),
    ],
    Validate,
    getBlogById
);

router.get(
    "/getblogbyseoid/:seoId",
    [
        check("seoId", "SEO ID is required").notEmpty(),
    ],
    Validate,
    getBlogBySeoId
);

router.put(
    "/updateblog/:id",
    [
        check("id", "Invalid blog ID").isMongoId(),
        check("title", "Title is required").optional().notEmpty(),
        check("description", "Description is required").optional().notEmpty(),
        check("body", "Body is required").optional().notEmpty(),
        check("seoId", "SEO ID is required").optional().notEmpty(),
        check("blogImageUrl", "Blog Image URL is required").optional().notEmpty(),
    ],
    Validate,
    updateBlog
);

router.delete(
    "/deleteblog/:id",
    [
        check("id", "Invalid blog ID").isMongoId(),
    ],
    Validate,
    deleteBlog
);

export default router;
