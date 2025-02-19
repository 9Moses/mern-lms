import express from "express";
import { editCourse,  getAllCourses,  getSingleCourse, uploadCourse } from "../controller/course.controller.js";
import { isAuthenticated, authorizeRoles } from "../middleware/auth.js";
const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);

courseRouter.put(
  "/edit-course/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);

courseRouter.get(
  "/get-course/:id",
  getSingleCourse
);

courseRouter.get(
  "/get-course",
  getAllCourses
);

export default courseRouter;
