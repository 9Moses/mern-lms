import express from "express";
import { isAuthenticated, authorizeRoles } from "../middleware/auth.js";
import { getUserAnalytics } from "../controller/analytics.controller.js";
const analyticsRouter = express.Router();

analyticsRouter.get("/get-users-analytics",isAuthenticated, authorizeRoles("admin"), getUserAnalytics )

export default analyticsRouter