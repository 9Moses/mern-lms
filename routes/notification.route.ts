import express from "express";
import { getNotification, updateNotification } from "../controller/notifications.controller.js";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";

const notificationRouter = express.Router();

notificationRouter.get(
    "/get-notification",
    isAuthenticated,
    authorizeRoles("admin"),
    getNotification
);

notificationRouter.put(
    "/update-notification/:id",
    isAuthenticated,
    authorizeRoles("admin"),
    updateNotification
);

export default notificationRouter;