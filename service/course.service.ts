import { Request, Response, NextFunction } from "express";
import CourseModel from "../model/course.model.js";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors.js";

//create course
export const createCourse = CatchAsyncErrors(
  async (data: any, res: Response) => {
    const course = await CourseModel.create(data);
    res.status(201).json({
      success: true,
      course,
    });
  }
);
