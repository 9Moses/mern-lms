import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../model/user.model.js";
import ErrorHandlers from "../utils/errorHandler.js";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import dotenv from "dotenv";
import path from "path";
import sendMail from "../utils/sendMail.js";
dotenv.config();
import { fileURLToPath } from "url"; // Import from 'url'
import {
  accessTokenOption,
  refreshTokenOption,
  sendToken,
} from "../utils/jwt.js";
import { redis } from "../utils/redis.js";
import { getUserById } from "../service/user.service.js";

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//register user
interface IRegistrationBoby {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, avatar } = req.body as IRegistrationBoby;

      const isEmailExist = await userModel.findOne({ email });

      if (isEmailExist) {
        return next(new ErrorHandlers("Email already exist", 400));
      }

      const user: IRegistrationBoby = {
        name,
        email,
        password,
      };
      const activationToken = createActivationToken(user);

      const activation_code = activationToken.activation_code;

      const data = { user: { name: user.name }, activation_code };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to acctivate your account!`,
          activationToken: activationToken.token,
          payload: {
            name: user.name,
            email: user.email,
            activation_code,
          },
        });
      } catch (error: any) {
        return next(new ErrorHandlers(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activation_code: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activation_code = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activation_code,
    },
    process.env.ACTIVATION_SECRET as Secret,
    { expiresIn: "5m" }
  );

  return { token, activation_code };
};

//activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activation_code: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as Secret
      ) as { user: IUser; activation_code: string };

      if (newUser.activation_code !== activation_code) {
        return next(new ErrorHandlers("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;

      const userExist = await userModel.findOne({ email });

      if (userExist) {
        return next(new ErrorHandlers("Email already exist", 400));
      }
      const user = await userModel.create({
        name,
        email,
        password,
      });

      res.status(200).json({
        success: true,
        payload: {
          name: user.name,
          email: user.email,
          activation_code,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);

//login user
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandlers("Please enter email and password", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandlers("Invalid email or password", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return next(new ErrorHandlers("Invalid password", 400));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);

//logout user
export const logoutUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      const userId = req.user?._id?.toString() || "";
      redis.del(userId);

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);

//update access token
export const updateAccessToken = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;

      const decode = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      const message = "Couldn't refresh token";

      if (!decode) {
        return next(new ErrorHandlers(message, 400));
      }

      const sessions = await redis.get(decode.id as string);

      if (!sessions) {
        return next(new ErrorHandlers("session", 400));
      }

      const user = JSON.parse(sessions);

      const accessToken = jwt.sign(
        { id: user.id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: "5m",
        }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: "3d",
        }
      );

      res.cookie("access_token", accessToken, accessTokenOption);
      res.cookie("refresh_token", refreshToken, refreshTokenOption);

      res.status(200).json({
        status: "success",
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);

//get user infor
export const getUserInfo = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id.toString();

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID is required" });
      }

      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar?: string;
}

//socil auth
export const socialAuth = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;

      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandlers(error.message, 400));
    }
  }
);
