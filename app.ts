import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
import { ErrorMiddleware } from "./middleware/error.js";

//body praser
app.use(express.json({ limit: "30mb" }));

//cookie parser
app.use(cookieParser());

//cors
app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);

//resting api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

//unkown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Rout ${req.originalUrl} not found`) as any;
  err.statusCode = 400;
  next(err);
});

app.use(ErrorMiddleware);
