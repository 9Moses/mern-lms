import express from "express";
import {
  activateUser,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updateAccessToken,
} from "../controller/user.controller.js";
import { isAuthenticated, authorizeRoles } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup", registrationUser);
userRouter.post("/activate", activateUser);
userRouter.post("/signin", loginUser);
userRouter.get("/signout", isAuthenticated, logoutUser);
userRouter.get("/refresh", updateAccessToken);
userRouter.get("/getuserinfo", isAuthenticated, getUserInfo);
userRouter.post("/socialauth", socialAuth);

export default userRouter;
