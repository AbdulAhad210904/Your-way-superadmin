import express from "express";
import Validate from "../middleware/validate.js";
import { check } from "express-validator";
import {
    createSupportTicket,
    getSupportTickets,
    getSupportTicketById,
    getSupportTicketsByUserId,
    updateSupportTicket,
    deleteSupportTicket,
    sendMessageToSupportTicket,
    getMessagesForSupportTicket
} from "../controllers/supportTicketController.js";

const router = express.Router();

router.post(
    "/createsupportticket",
    [
        check("userId", "User ID is required").notEmpty(),
        check("subject", "Subject is required").notEmpty(),
        check("message", "Message is required").notEmpty(),
    ],
    Validate,
    createSupportTicket
);

router.get("/getsupporttickets", Validate, getSupportTickets);

router.get(
    "/getsupportticket/:id",
    [
        check("id", "Invalid support ticket ID").isMongoId(),
    ],
    Validate,
    getSupportTicketById
);

router.get(
    "/getsupportticketsbyuserid/:userId",
    [
        check("userId", "Invalid user ID").isMongoId(),
    ],
    Validate,
    getSupportTicketsByUserId
);

router.put(
    "/updatesupportticket/:id",
    [
        check("id", "Invalid support ticket ID").isMongoId(),
        check("subject", "Subject is required").optional().notEmpty(),
        check("message", "Message is required").optional().notEmpty(),
        check("status", "Status should be one of 'open', 'in-progress', 'closed'").optional().isIn(['open', 'in-progress', 'closed']),
    ],
    Validate,
    updateSupportTicket
);

router.delete(
    "/deletesupportticket/:id",
    [
        check("id", "Invalid support ticket ID").isMongoId(),
    ],
    Validate,
    deleteSupportTicket
);

router.post(
    "/supportticket/:id/message",
    [
        check("id", "Invalid support ticket ID").isMongoId(),
        check("senderId", "Sender ID is required").notEmpty(),
        check("content", "Message content is required").notEmpty(),
    ],
    Validate,
    sendMessageToSupportTicket
);

router.get(
    "/supportticket/:id/messages",
    [
        check("id", "Invalid support ticket ID").isMongoId(),
    ],
    Validate,
    getMessagesForSupportTicket
);

export default router;