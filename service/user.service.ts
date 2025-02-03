import { Response } from "express";
import userModel from "../model/user.model.js";
import { Types } from "mongoose";

export const getUserById = async (
  id: Types.ObjectId | string,
  res: Response
) => {
  const user = await userModel.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({
    success: true,
    user,
  });
};
