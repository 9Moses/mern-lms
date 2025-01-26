import express from "express";
import { registrationUser } from "../controller/user.controller.js";

const userRouter = express.Router();

userRouter.post("/signup", registrationUser);

export default userRouter;
