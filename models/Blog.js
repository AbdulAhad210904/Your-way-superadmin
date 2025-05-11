import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  seoId: {
    type: String,
    required: true,
    unique: true,
  },
  blogImageUrl: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: Number,
    default: null,
  },
},
{
    timestamps: true,
}
);

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
