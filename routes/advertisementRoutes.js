import express from "express";
import Validate from "../middleware/validate.js";
import { check } from "express-validator";
import { createAdvertisement, getAdvertisements, getAdvertisementById, updateAdvertisement, deleteAdvertisement } from "../controllers/advertisementController.js";

const router = express.Router();

router.post(
  "/createadvertisment",
  [
    check("title", "Title is required").notEmpty(),
    check("description", "Description is required").notEmpty(),
    check("image", "Image is required").notEmpty(),
  ],
  Validate,
  createAdvertisement
);

router.get("/getadvertisments",Validate, getAdvertisements);

router.get(
    "/getadvertisment/:id",
    [
        check("id", "Invalid advertisment ID").isMongoId(),
    ],
    Validate,
    getAdvertisementById
);

router.put(
    "/updateadvertisment/:id",
    [
        check("id", "Invalid advertisment ID").isMongoId(),
        check("title", "Title is required").optional().notEmpty(),
        check("description", "Description is required").optional().notEmpty(),
        check("image", "Image is required").optional().notEmpty(),
    ],
    Validate,
    updateAdvertisement
);

router.delete("/deleteadvertisment/:id",
    [
        check("id","Invalid advertisment ID").isMongoId(),
    ],
    Validate,
    deleteAdvertisement
);

export default router;