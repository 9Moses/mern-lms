import { Request } from "express";
import { IUser } from "../model/user.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
