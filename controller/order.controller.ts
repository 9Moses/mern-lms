import { NextFunction, Request, Response } from "express";
import {CatchAsyncErrors} from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import OrderModel, { IOrder } from "../model/order.model.js";
import userModel from "../model/user.model.js";
import CourseModel from "../model/course.model.js";
import path from "path";
import ejs, { name } from "ejs";
import sendMail from "../utils/sendMail.js";
import NotificationModel from "../model/notification.model.js";
import { request } from "http";
import { newOrder } from "../service/order.service.js";

//create order
export const createOrder = CatchAsyncErrors(async(req:Request, res:Response, next:NextFunction) => {
    try {
        const {courseId, payment_info} = req.body;

        const user = await userModel.findById(req.user?._id);

        const courseExistInUser = user?.course.some((course: any) => course._id.toString() === courseId);

        if(courseExistInUser){
            return next(new ErrorHandler("You are already enrolled in this course", 400));
        }
        const course = await CourseModel.findById(courseId);

        if(!course){
            return next(new ErrorHandler("Course not found", 400));
        }

        const data:any ={
            courseId: course._id,
            userId: user?._id,
            payment_info  
        }

        

        const mailData ={
            order:{
                _id: (course._id as string).slice(0, 5), 
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-Us', {year: 'numeric', month: 'long', day: 'numeric'}),
            }
        }
        

        const html = await ejs.renderFile(path.join(__dirname, "../mails/newOrder.ejs"), {order: mailData});

        try {
            if(user){
                await sendMail({
                   email: user.email,
                   subject: "Order Confirmation",
                   template: "newOrder.ejs",
                   data: mailData 
                })
            }
        } catch (error:any) {
            return next(new ErrorHandler(error.message, 400));
        }
       
        user?.course.push({ courseId: course?._id as string });
        await user?.save();

       await NotificationModel.create({
            user: req.user?._id,
            title: `New Order ${course?.name}`,
            message: `You have a new order for ${course?.name}`,
            type: "order",
            course: course?._id
        })

       course.purchased ? course.purchased += 1 : course.purchased ;

        await course?.save();
        newOrder(data,res, next);
      
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
    }
})