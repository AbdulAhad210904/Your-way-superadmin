import mongoose from "mongoose";

const FeatureSchema = new mongoose.Schema(
  {
    title: {
        type: String,
        required: true,
        max: 50,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
  },
  {
    timestamps: true,
}
);
const Feature = mongoose.model("Feature", FeatureSchema);
export default Feature;