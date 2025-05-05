import NotificationModel from "../model/notification.model.js";
import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";

//get all notifications - only admin
export const getNotification = CatchAsyncErrors (
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const notifications = await NotificationModel.find().sort({createdAt: -1});
        res.status(200).json({
          success: true,
          notifications,
        });

      } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
      }
    }
);

//update notification -- only admin
export const updateNotification = CatchAsyncErrors (
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const notification = await NotificationModel.findByIdAndUpdate(req.params.id);
       
        if (!notification) {
          return next(new ErrorHandler("Notification not found", 404));
        }else{
          notification.status ? (notification.status = "read") : (notification.status = "unread");
  
        }
        await notification.save();
        const notifications = await NotificationModel.find().sort({createdAt: -1});

        res.status(200).json({
          success: true,
          notifications,
        });
      } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
      }
    }
)