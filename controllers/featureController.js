import Feature from '../models/Feature.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });


export const createFeature = async (req, res) => {
  const { title, description } = req.body;
  const file = req.file;

  try {
    // Check that the feature title does not already exist
    const featureExists = await Feature.findOne({ title });
    if (featureExists) {
      return res.status(400).json({ message: 'Feature with this title already exists. Please choose a different title.' });
    }

    // Initialize imageUrl
    let imageUrl = '';
    //console.log('Received file:', file);

    // Upload the image to Cloudinary if a file was uploaded
    if (file) {
      //console.log("Uploading image to Cloudinary...");
      imageUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer); // Pass the buffer to Cloudinary
      });
    } else {
      return res.status(400).json({ message: 'Image is required.' });
    }

    // Create new feature
    //console.log("Image URL: ", imageUrl);
    const newFeature = new Feature({ title, description, image: imageUrl });
    await newFeature.save();
    res.status(201).json(newFeature);
  } catch (error) {
    res.status(500).json({ message: 'Error creating feature', error: error.message });
  }
};
// export const createFeature = async (req, res) => {
//   const { title, description, image } = req.body;

//   try {
//     const newFeature = new Feature({ title, description, image });
//         //check that such title doesnot exisits in database as project title should be unique
//         const featureExists = await Feature.findOne({ title});
//         if (featureExists) {
//             return res.status(400).json({ message: 'Feature with this title already exists. Please choose a different title.' });
//         }
//     await newFeature.save();
//     res.status(201).json(newFeature);
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating feature', error: error.message });
//   }
// };

export const getFeatures = async (req, res) => {
  try {
    const features = await Feature.find();
    res.status(200).json(features);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching features', error: error.message });
  }
};

export const getFeatureById = async (req, res) => {
  const { id } = req.params;

  try {
    const feature = await Feature.findById(id);
    if (!feature) return res.status(404).json({ message: 'Feature not found' });
    res.status(200).json(feature);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feature', error: error.message });
  }
};

export const updateFeature = async (req, res) => {
  const { id } = req.params;
  const { title, description, image } = req.body;

  try {
    const updatedFeature = await Feature.findByIdAndUpdate(
      id,
      { title, description, image },
      { new: true, runValidators: true }
    );
    if (!updatedFeature) return res.status(404).json({ message: 'Feature not found' });
    res.status(200).json(updatedFeature);
  } catch (error) {
    res.status(500).json({ message: 'Error updating feature', error: error.message });
  }
};

export const deleteFeature = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedFeature = await Feature.findByIdAndDelete(id);
    if (!deletedFeature) return res.status(404).json({ message: 'Feature not found' });
    const featureImagePublicId = deletedFeature.image.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(featureImagePublicId);
    res.status(200).json({ message: 'Feature deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting feature', error: error.message });
  }
};
