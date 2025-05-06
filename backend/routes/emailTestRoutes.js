import express from "express";
import { sendEmail } from "../utils/emailService.js";
import { validate, emailTestSchema } from "../validations/index.js";

const router = express.Router();

// Send a test email
router.post("/send", validate(emailTestSchema), async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    // Send test email
    const result = await sendEmail({
      to,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      message: "Test email sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to send test email: ${error.message}`,
    });
  }
});

export default router;
