import { NextFunction, Response } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import OrderModel from "../model/order.model.js";

//create new order
export const newOrder = CatchAsyncErrors(
   async (data: any, res:Response) => {
   const order = await OrderModel.create(data); 
    res.status(200).json({
        success: true,
        message: "Order created successfully",
        order
    })
   } 
)


//Get all orders
export const getAllOrdersService = async (res: Response) => {
    const orders = await OrderModel.find({ createdAt: -1 });
    res.status(200).json({
      success: true,
      orders,
    });
  };