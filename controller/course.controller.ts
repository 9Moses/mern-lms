import { Request, Response, NextFunction } from "express";
import CourseModel from "../model/course.model.js";
import ErrorHandlers from "../utils/errorHandler.js";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import cloudinary from "cloudinary";
import {
  createCourse,
  getAllCourseService,
} from "../service/course.service.js";
import { redis } from "../utils/redis.js";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url"; // Import from 'url'
import sendMail from "../utils/sendMail.js";
import NotificationModel from "../model/notification.model.js";
// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

//add question in course
interface IAddQuestion {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body as IAddQuestion;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandlers("Invalid content id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandlers("Invalid content id", 400));
      }

      //create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      //add this question to our course content
      courseContent?.questions.push(newQuestion);

      await NotificationModel.create({
        user: req.user?._id,
        title: `New Questions Receivied`,
        message: `You have a new question for ${courseContent?.title}`,
      });

      //save the update course
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 500));
    }
  }
);

//add answer in course question
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId } =
        req.body as IAddAnswerData;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandlers("Invalid content id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandlers("Invalid content id", 400));
      }

      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandlers("Invalid content id", 400));
      }

      //create a new answers object
      const newAnswer: any = {
        user: req?.user,
        answer,
      };

      //add this answer to our cousre content
      question?.questionReplies?.push(newAnswer);

      //save the update course
      await course?.save();

      if (req.user?._id === question.user?._id) {
        //create a notification
        await NotificationModel.create({
          user: req.user?._id,
          title: `New Answer Receivied`,
          message: `You have a new answer for ${courseContent?.title}`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandlers(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 500));
    }
  }
);

//add review in course
interface IAddReviewData {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.course;

      const courseId = req.params.id;

      const courseExist = userCourseList?.some(
        (cousre: any) => cousre._id.toString == courseId
      );

      if (!courseExist) {
        return next(
          new ErrorHandlers("You are not eligible to access this course", 400)
        );
      }

      const course = await CourseModel.findById(courseId);

      const { review, rating } = req.body as IAddReviewData;

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };

      course?.reviews.push(reviewData);

      let avg = 0;
      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      if (course) {
        course.ratings = avg / course?.reviews.length; // eg. we have 2 review one is 5 and other is 4 = 9 / 2 = 4.5 rating
      }

      await course?.save();

      //create notification
      const notification = {
        title: "New Review Recieved",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      };

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 500));
    }
  }
);

interface IAddReviewReply {
  comment: string;
  courseId: string;
  reviewId: string;
}

//add reply in review
export const addReplyToReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewReply;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandlers("Course not found", 404));
      }

      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandlers("Review not found", 404));
      }

      const replyData: any = {
        user: req.user,
        comment,
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }
      review?.commentReplies?.push(replyData);

      await course.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 500));
    }
  }
);

//get all course  - only for admin
export const getAllCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCourseService(res);
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);

//delete course --- only for admin
export const deleteCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);
      if (!course ) {
        return next(new ErrorHandlers("course not found", 400));
      }

      await course.deleteOne({ id });
      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "Course  deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);