import express from "express";
import Validate from "../middleware/validate.js";
import { check } from "express-validator";
import { createReview, getReviews, getReviewByReviewId, getReviewByUserId, updateReview, updateReviewByUserId, deleteReview } from "../controllers/reviewController.js";

const router = express.Router();

router.post("/createreview",
    [
        check("userId", "User ID is required").notEmpty(),
        check("rating", "Rating is required").notEmpty(),
        check("comment", "Comment is required").notEmpty(),
    ],
    Validate,
    createReview
);

router.get("/getreviews", Validate, getReviews);

router.get(
    "/getreview/:id",
    [
        check("id", "Invalid review ID").isMongoId(),
    ],
    Validate,
    getReviewByReviewId
);

router.get(
    "/getreviewbyuserid/:userId",
    [
        check("userId", "Invalid user ID").isMongoId(),
    ],
    Validate,
    getReviewByUserId
);

router.put(
    "/updatereview/:id",
    [
        check("id", "Invalid review ID").isMongoId(),
        check("userId", "User ID is required").optional().notEmpty(),
        check("rating", "Rating is required").optional().notEmpty(),
        check("comment", "Comment is required").optional().notEmpty(),
    ],
    Validate,
    updateReview
);

router.put(
    "/updatereviewbyuserid/:userId",
    [
        check("userId", "Invalid user ID").isMongoId(),
        check("rating", "Rating is required").optional().notEmpty(),
        check("comment", "Comment is required").optional().notEmpty(),
    ],
    Validate,
    updateReviewByUserId
);

router.delete(
    "/deletereview/:id",
    [
        check("id", "Invalid review ID").isMongoId(),
    ],
    Validate,
    deleteReview
);

export default router;