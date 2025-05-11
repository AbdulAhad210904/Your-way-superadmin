import express from "express";
import {createFeature, getFeatures, getFeatureById, updateFeature, deleteFeature} from "../controllers/featureController.js";
import Validate from "../middleware/validate.js";
import { check } from "express-validator";
import multer from "multer";


const router = express.Router();
const upload = multer(); // Use default storage for file uploads

router.post(
  "/createfeature",
  upload.single('image'), // Add this line to handle file upload
  [
    check("title", "Title is required").notEmpty(),
    check("description", "Description is required").notEmpty(),
  ],
  Validate,
  createFeature
);

router.get("/getfeatures",Validate, getFeatures);

router.get(
  "/getfeature/:id",
  [
    check("id", "Invalid feature ID").isMongoId(),
  ],
  Validate,
  getFeatureById
);

router.put(
  "/updatefeature/:id",
  [
    check("id", "Invalid feature ID").isMongoId(),
    check("title", "Title is required").optional().notEmpty(),
    check("description", "Description is required").optional().notEmpty(),
    check("image", "Image is required").optional().notEmpty(),
  ],
  Validate,
  updateFeature
);

router.delete("/deletefeature/:id",
    [
        check("id","Invalid feature ID").isMongoId(),
    ],
    Validate,
    deleteFeature
);

export default router;
