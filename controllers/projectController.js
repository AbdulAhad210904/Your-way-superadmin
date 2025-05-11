import Project from "../models/Project.js";
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const createProject = async (req, res) => {
    const { userId, title, description, link } = req.body;
    const projectImageFile = req.files?.projectImage;
    const projectLogoFile = req.files?.projectLogo;

    try {
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found. Cannot create project.' });
        }

        // Check that such title does not exist in the database as project title should be unique
        const projectExists = await Project.findOne({ title });
        if (projectExists) {
            return res.status(400).json({ message: 'Project with this title already exists. Please choose a different title.' });
        }

        let projectImageUrl = '';
        let projectLogoUrl = '';

        if (projectImageFile) {
            projectImageUrl = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },
                    (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result.secure_url);
                    }
                );
                uploadStream.end(projectImageFile[0].buffer);
            });
        } else {
            return res.status(400).json({ message: 'Project image is required.' });
        }

        if (projectLogoFile) {
            projectLogoUrl = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },
                    (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result.secure_url);
                    }
                );
                uploadStream.end(projectLogoFile[0].buffer);
            });
        } else {
            return res.status(400).json({ message: 'Project logo is required.' });
        }

        const newProject = new Project({
            userId,
            title,
            description,
            projectImage: projectImageUrl,
            projectLogo: projectLogoUrl,
            link
        });

        await newProject.save();
        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error: error.message });
    }
};


export const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('userId', 'name email');
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
};

export const getProjectByProjectId = async (req, res) => {
    const { id } = req.params;

    try {
        const project = await Project.findById(id).populate('userId', 'name email');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error: error.message });
    }
};

export const getProjectByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const projects = await Project.find({ userId }).populate('userId', 'name email');
        if (projects.length === 0) return res.status(404).json({ message: 'No projects found for this user.' });
        res.status(200).json(projects);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching projects by user ID', error: error.message });
    }
};

export const updateProject = async (req, res) => {
    const { id } = req.params;
    const { userId, title, description, projectImage, projectLogo, link } = req.body;

    try {
        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { userId, title, description, projectImage, projectLogo, link },
            { new: true, runValidators: true }
        );
        if (!updatedProject) return res.status(404).json({ message: 'Project not found' });
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};

export const deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        //extract the public IDs from the project images
        const projectImagePublicId = project.projectImage.split('/').pop().split('.')[0];
        const projectLogoPublicId = project.projectLogo.split('/').pop().split('.')[0];

        //delete images from Cloudinary
        await Promise.all([
            cloudinary.uploader.destroy(projectImagePublicId),
            cloudinary.uploader.destroy(projectLogoPublicId)
        ]);

        await Project.findByIdAndDelete(id);
        
        res.status(200).json({ message: 'Project and associated images deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
};
