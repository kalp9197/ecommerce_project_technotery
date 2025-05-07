import express from "express";
import { emailService } from "../services/index.js";
import * as validation from "../validations/index.js";
import { HTTP_STATUS } from "../constants/index.js";

const router = express.Router();

// Send a test email
router.post(
  "/send",
  validation.validate(validation.emailTestSchema),
  async (req, res) => {
    try {
      const { to, subject, text, html } = req.body;

      // Send test email
      const result = await emailService.sendEmail({
        to,
        subject,
        text,
        html,
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Email sent successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: `Failed to send email: ${error.message}`,
      });
    }
  }
);

export default router;
