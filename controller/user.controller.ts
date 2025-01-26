import { Request, Response, NextFunction } from "express";
import userModel from "../model/user.model.js";
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

      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };

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
            activationCode,
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
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    { expiresIn: "5m" }
  );

  return { token, activationCode };
};
