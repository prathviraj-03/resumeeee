import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

type ValidationErrorItem = {
  param: string;
  msg: string;
};

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(422).json({
    errors: errors.array().map((error: ValidationErrorItem) => ({
      field: error.param,
      message: error.msg,
    })),
  });
}
