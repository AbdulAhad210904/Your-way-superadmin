import Advertisement from "../models/Advertisement.js";

export const createAdvertisement = async (req, res) => {
    const { title, description, image, link } = req.body;
    
    try {
        const newAdvertisement = new Advertisement({ title, description, image, link });
        await newAdvertisement.save();
        res.status(201).json(newAdvertisement);
    } catch (error) {
        res.status(500).json({ message: "Error creating advertisement", error: error.message });
    }
};

export const getAdvertisements = async (req, res) => {
    try {
        const advertisements = await Advertisement.find();
        res.status(200).json(advertisements);
    } catch (error) {
        res.status(500).json({ message: "Error fetching advertisements", error: error.message });
    }
};

export const getAdvertisementById = async (req, res) => {
    const { id } = req.params;

    try {
        const advertisement = await Advertisement.findById(id);
        if (!advertisement) return res.status(404).json({ message: "Advertisement not found" });
        res.status(200).json(advertisement);
    } catch (error) {
        res.status(500).json({ message: "Error fetching advertisement", error: error.message });
    }
};

export const updateAdvertisement = async (req, res) => {
    const { id } = req.params;
    const { title, description, image, link } = req.body;

    try {
        const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
            id,
            { title, description, image, link },
            { new: true, runValidators: true }
        );
        if (!updatedAdvertisement) return res.status(404).json({ message: "Advertisement not found" });
        res.status(200).json(updatedAdvertisement);
    } catch (error) {
        res.status(500).json({ message: "Error updating advertisement", error: error.message });
    }
};

export const deleteAdvertisement = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedAdvertisement = await Advertisement.findByIdAndDelete(id);
        if (!deletedAdvertisement) return res.status(404).json({ message: "Advertisement not found" });
        res.status(200).json({ message: "Advertisement deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting advertisement", error: error.message });
    }
};