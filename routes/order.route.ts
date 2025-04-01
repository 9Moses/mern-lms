import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { createOrder } from "../controller/order.controller.js";

const orderRouter = express.Router();

orderRouter.post(
    "/create-order",
    isAuthenticated,
    createOrder
);

export default orderRouter;