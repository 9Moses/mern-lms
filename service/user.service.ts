import { Response } from "express";
import { redis } from "../utils/redis.js";
import userModel from "../model/user.model.js";

export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(200).json({
      success: true,
      user,
    });
  }
};

//Get all users
export const getAllUsersService = async (res: Response) => {
  const users = await userModel.find({ createdAt: -1 });
  res.status(200).json({
    success: true,
    users,
  });
};

//update user role
export const updateUserRolesService = async(res:Response, id:string, role:string)=>{
  const user = await userModel.findByIdAndUpdate(id, {role},{new:true}
  );

  res.status(201).json({
    success: true,
    user
  })
}