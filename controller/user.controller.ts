import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../model/user.model.js";
import ErrorHandlers from "../utils/errorHandler.js";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors.js";
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import dotenv from "dotenv";
import path from "path";
import sendMail from "../utils/sendMail.js";
dotenv.config();
import { fileURLToPath } from "url"; // Import from 'url'
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
