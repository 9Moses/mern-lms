import express from "express";
import {
  activateUser,
  registrationUser,
} from "../controller/user.controller.js";

const userRouter = express.Router();

userRouter.post("/signup", registrationUser);
userRouter.post("/activate", activateUser);

export default userRouter;
