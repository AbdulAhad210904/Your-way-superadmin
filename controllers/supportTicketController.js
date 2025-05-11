import SupportTicket from "../models/SupportTicket.js";
import User from "../models/User.js";
import AdminUser from "../models/AdminUser.js";

export const createSupportTicket = async (req, res) => {
    const { userId, subject, message } = req.body;

    try {
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found. Cannot create support ticket.' });
        }

        const newSupportTicket = new SupportTicket({
            userId,
            subject,
            message,
        });

        await newSupportTicket.save();
        res.status(201).json({ message: 'Support ticket created successfully', newSupportTicket });

    } catch (error) {
        res.status(500).json({ message: 'Error creating support ticket', error: error.message });
    }
};

export const getSupportTickets = async (req, res) => {
    try {
        const supportTickets = await SupportTicket.find()
            .populate('userId', 'name email')
            .populate('messages.senderId', 'name email');
        res.status(200).json(supportTickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching support tickets', error: error.message });
    }
};

export const getSupportTicketById = async (req, res) => {
    const { id } = req.params;

    try {
        const supportTicket = await SupportTicket.findById(id)
            .populate('userId', 'name email')
            .populate('messages.senderId', 'name email');
        if (!supportTicket) return res.status(404).json({ message: 'Support ticket not found' });
        res.status(200).json(supportTicket);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching support ticket', error: error.message });
    }
};

export const getSupportTicketsByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const supportTickets = await SupportTicket.find({ userId })
            .populate('userId', 'name email')
            .populate('messages.senderId', 'name email');
        if (supportTickets.length === 0) return res.status(404).json({ message: 'No support tickets found for this user.' });
        res.status(200).json(supportTickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching support tickets by user ID', error: error.message });
    }
};

export const updateSupportTicket = async (req, res) => {
    const { id } = req.params;
    const { subject, message, status } = req.body;

    try {
        const updatedSupportTicket = await SupportTicket.findByIdAndUpdate(
            id,
            { subject, message, status },
            { new: true, runValidators: true }
        ).populate('userId', 'name email').populate('messages.senderId', 'name email');
        if (!updatedSupportTicket) return res.status(404).json({ message: 'Support ticket not found' });
        res.status(200).json({ message: 'Support ticket updated successfully', updatedSupportTicket });

    } catch (error) {
        res.status(500).json({ message: 'Error updating support ticket', error: error.message });
    }
};

export const deleteSupportTicket = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedSupportTicket = await SupportTicket.findByIdAndDelete(id);
        if (!deletedSupportTicket) return res.status(404).json({ message: 'Support ticket not found' });
        res.status(200).json({ message: 'Support ticket deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting support ticket', error: error.message });
    }
};

export const sendMessageToSupportTicket = async (req, res) => {
    const { id } = req.params;
    const { senderId, content } = req.body;

    try {
        const supportTicket = await SupportTicket.findById(id);
        if (!supportTicket) return res.status(404).json({ message: 'Support ticket not found' });

        // Check if sender is a User or AdminUser
        const userExists = await User.findById(senderId);
        const adminExists = await AdminUser.findById(senderId);
        if (!userExists && !adminExists) return res.status(404).json({ message: 'Sender not found' });

        supportTicket.messages.push({ senderId, content });
        await supportTicket.save();

        const populatedTicket = await SupportTicket.findById(id)
            .populate('userId', 'name email')
            .populate([
                { path: 'messages.senderId', model: 'User', select: 'name email' },
                { path: 'messages.senderId', model: 'AdminUser', select: 'name email' }
            ]);

        res.status(200).json({ message: 'Message sent successfully', supportTicket: populatedTicket });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
};

export const getMessagesForSupportTicket = async (req, res) => {
    const { id } = req.params;

    try {
        const supportTicket = await SupportTicket.findById(id);
        if (!supportTicket) return res.status(404).json({ message: 'Support ticket not found' });

        // Manually populate senderId for each message
        const messages = await Promise.all(supportTicket.messages.map(async (message) => {
            let sender = await User.findById(message.senderId).select('name email');
            if (!sender) {
                sender = await AdminUser.findById(message.senderId).select('name email');
            }
            return {
                ...message.toObject(),
                senderId: sender ? { _id: sender._id, name: sender.name, email: sender.email } : null
            };
        }));

        res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};