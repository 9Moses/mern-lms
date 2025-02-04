import { Request, Response, NextFunction } from "express";
import CourseModel from "../model/course.model.js";
import ErrorHandlers from "../utils/errorHandler.js";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import cloudinary from "cloudinary";
import { createCourse } from "../service/course.service.js";

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
