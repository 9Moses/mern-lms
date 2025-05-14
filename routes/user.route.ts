import express from "express";
import {
  activateUser,
  deleteUser,
  getAllUsers,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updateAccessToken,
  updatePassword,
  updateProfilePic,
  updateUserInfo,
  updateUserRole,
} from "../controller/user.controller.js";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup", registrationUser);
userRouter.post("/activate", activateUser);
userRouter.post("/signin", loginUser);
userRouter.get("/signout", isAuthenticated, logoutUser);
userRouter.get("/refresh", updateAccessToken);
userRouter.get("/getuserinfo", isAuthenticated, getUserInfo);
userRouter.post("/socialauth", socialAuth);
userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);
userRouter.put("/update-user-password", isAuthenticated, updatePassword);
userRouter.put("/update-user-avatar", isAuthenticated, updateProfilePic);
userRouter.get(
  "/get-users",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllUsers
);

userRouter.put(
  "/update-user",
  isAuthenticated,
  authorizeRoles("admin"),
  updateUserRole
);

userRouter.delete(
  "/delete-user/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteUser
);

export default userRouter;
