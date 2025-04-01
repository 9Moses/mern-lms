import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
import { ErrorMiddleware } from "./middleware/error.js";
import userRouter from "./routes/user.route.js";
import courseRouter from "./routes/course.route.js";
import orderRouter from "./routes/order.route.js";

export const app = express();
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

//routes
app.use("/api", userRouter);
app.use("/api", courseRouter);
app.use("/api", orderRouter);

//resting api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

//unkown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 400;
  next(err);
});

app.use(ErrorMiddleware);
