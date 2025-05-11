import Blog from "../models/Blog.js";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

//Multer Setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const createBlog = async (req, res) => {
    const { title, description, body, seoId, sortOrder } = req.body;
    const file = req.file;

    try {
        const existingBlog = await Blog.findOne({ title });
        const existingBlogUrl = await Blog.findOne({ seoId });
        if (existingBlog) {
            return res.status(400).json({ message: "Blog title must be unique" });
        }
        if (existingBlogUrl) {
            return res.status(400).json({ message: "Blog SEO ID must be unique" });
        }

        let blogImageUrl = '';

        // Upload image to Cloudinary if a file is provided
        if (file) {
            blogImageUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: 'image' },
                (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result.secure_url);
                }
            );
            uploadStream.end(file.buffer);
            });
        } else {
            return res.status(400).json({ message: 'Blog image is required.' });
        }
        
        const newBlog = new Blog({
            title,
            description,
            body,
            seoId,
            blogImageUrl,
            sortOrder
        });

        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (error) {
        res.status(500).json({ message: "Error creating blog", error: error.message });
    }
};

export const getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blogs", error: error.message });
    }
};

export const getBlogById = async (req, res) => {
    const { id } = req.params;

    try {
        const blog = await Blog.findById(id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        blog.views += 1;
        await blog.save();

        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blog", error: error.message });
    }
};

export const getBlogBySeoId = async (req, res) => {
    const { seoId } = req.params;

    try {
        const blog = await Blog.findOne({ seoId });
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        blog.views += 1;
        await blog.save();

        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: "Error fetching blog", error: error.message });
    }
};

export const updateBlog = async (req, res) => {
    const { id } = req.params;
    const { title, description, body, seoId, blogImageUrl, sortOrder } = req.body;

    try {
        if (title) {
            const existingBlog = await Blog.findOne({ title, _id: { $ne: id } });
            if (existingBlog ) {
                return res.status(400).json({ message: "Blog title must be unique" });
            }
        }
        if (seoId) {
            const existingBlogUrl = await Blog.findOne({ seoId, _id:{$ne:id} });
            if (existingBlogUrl) {
                return res.status(400).json({ message: "Blog SEO ID must be unique" });
            }
        }
        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            { title, description, body, seoId, blogImageUrl, sortOrder },
            { new: true, runValidators: true }
        );
        if (!updatedBlog) return res.status(404).json({ message: "Blog not found" });

        res.status(200).json(updatedBlog);
    } catch (error) {
        res.status(500).json({ message: "Error updating blog", error: error.message });
    }
};

export const deleteBlog = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedBlog = await Blog.findByIdAndDelete(id);
        if (!deletedBlog) return res.status(404).json({ message: "Blog not found" });

        //get id of image
        const blogImagePublicId = deletedBlog.blogImageUrl.split('/').pop().split('.')[0];

        //delete from Cloudinary
        await cloudinary.uploader.destroy(blogImagePublicId);

        res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting blog", error: error.message });
    }
};

