import express from "express";
import { emailController } from "../../controllers/public/index.js";
import * as validation from "../../validations/index.js";

const router = express.Router();

router.post(
  "/send",
  validation.validate(validation.emailTestSchema),
  emailController.sendTestEmail
);

export default router;
