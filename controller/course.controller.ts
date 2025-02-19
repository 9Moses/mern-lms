import { Request, Response, NextFunction } from "express";
import CourseModel from "../model/course.model.js";
import ErrorHandlers from "../utils/errorHandler.js";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import cloudinary from "cloudinary";
import { createCourse } from "../service/course.service.js";
import { redis } from "../utils/redis.js";

//upload course
export const uploadCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const upload = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "Courses",
        });

        data.thumbnail = {
          public_id: upload.public_id,
          url: upload.secure_url,
        };
      }

      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);

//data course
export const editCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);

        const upload = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "Course",
        });

        data.thumbnail = {
          public_id: upload.public_id,
          url: upload.secure_url,
        };
      }

      const courseId = req.params.id;

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 500));
    }
  }
);

//get single coure --- without purchasing
export const getSingleCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const isCacheExist = await redis.get(courseId);

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });

      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set(courseId, JSON.stringify(course));

        if (!course) {
          return res
            .status(404)
            .json({ success: false, message: "Course not found" });
        }

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 500));
    }
  }
);

//get all course -- without purchasing
export const getAllCourses = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");

      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const course = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set("allCourses", JSON.stringify(course));
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 500));
    }
  }
);

//get course content -- only for valid user
export const getCourseByUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.course;
      const courseId = req.params.id;

      const courseExist = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );

      if (!courseExist) {
        return next(
          new ErrorHandlers("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);

      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 500));
    }
  }
);
