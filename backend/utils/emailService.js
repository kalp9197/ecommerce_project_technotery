import nodemailer from "nodemailer";

// Create transporter for development
const createDevTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    testAccount,
  };
};

// Send email
export const sendEmail = async (options) => {
  try {
    const { transporter, testAccount } = await createDevTransporter();
    const from = `"E-Commerce Store" <${testAccount.user}>`;

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });

    console.log(`Message sent: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Email verification template
export const getVerificationEmailTemplate = (name, verificationUrl) => {
  return {
    subject: "Verify Your Email Address",
    text: `Hello ${name},\n\nPlease verify your email by clicking: ${verificationUrl}\n\nThis link expires in 24 hours.\n\nRegards,\nE-Commerce Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${name},</p>
        <p>Please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
        <p>Regards,<br>E-Commerce Team</p>
      </div>
    `,
  };
};
