import express from "express";
import {
  activateUser,
  loginUser,
  logoutUser,
  registrationUser,
} from "../controller/user.controller.js";

const userRouter = express.Router();

userRouter.post("/signup", registrationUser);
userRouter.post("/activate", activateUser);
userRouter.post("/signin", loginUser);
userRouter.get("/signout", logoutUser);

export default userRouter;
