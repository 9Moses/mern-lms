class ErrorHandler extends Error {
  statusCode: Number; // Use lowercase `number` here
  constructor(message: any, statusCode: Number) {
    // Use lowercase `number` here
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
export default ErrorHandler;
