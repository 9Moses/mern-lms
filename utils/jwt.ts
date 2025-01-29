import dotenv from "dotenv";
dotenv.config();
import { Response } from "express";
import { IUser } from "../model/user.model.js";
import { redis } from "./redis.js";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  //upload session to redis
  redis.set(user._id.toString(), JSON.stringify(user));

  const accessTokenExpire = parseInt(
    process.env.ACCESS_TOKEN_EXPIRE || "2000",
    10
  );
  const refreshTokenExpire = parseInt(
    process.env.REFRESH_TOKEN_EXPIRE || "1200",
    10
  );

  //option for cookies
  const accessTokenOption: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 1000),
    maxAge: accessTokenExpire * 100000,
    httpOnly: true,
    sameSite: "lax",
  };

  const refreshTokenOption: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 1000),
    maxAge: refreshTokenExpire * 1000,
    httpOnly: true,
    sameSite: "lax",
  };

  //only set secure to true the in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOption.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOption);
  res.cookie("refresh_token", refreshToken, refreshTokenOption);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
    payload: {
      user: user.name,
      accessToken,
    },
  });
};
