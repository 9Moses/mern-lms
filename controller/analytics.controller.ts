import { Request, Response,NextFunction } from "express";
import ErrorHandlers from "../utils/errorHandler.js"
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import { generateLast12MonthsData } from "../utils/analytics.generator.js";
import userModel from "../model/user.model.js";

//get users analytics --- only admin 
export const getUserAnalytics = CatchAsyncErrors(async(req:Request, res:Response, next:NextFunction)=>{
 try {
    const users = await generateLast12MonthsData(userModel)
    
    res.status(200).json({
        success: true,
        message: "User Analytics"
     })
 } catch (error:any) {
    return next(new ErrorHandlers(error.message, 400));
 }
 
})

