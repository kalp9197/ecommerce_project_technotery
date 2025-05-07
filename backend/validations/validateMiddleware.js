import { validationResult } from "express-validator";

// Middleware to run express-validator validations and handle errors
export const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(422).json({
      success: false,
      errors: errors.array(),
    });
  };
};
