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


//Get all courses
export const getAllCourseService = async (res: Response) => {
  const courses = await CourseModel.find({ createdAt: -1 });
  res.status(200).json({
    success: true,
    courses,
  });
};