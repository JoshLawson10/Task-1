import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true" || false,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

export const sendMagicLinkEmail = async (email: string, token: string) => {
  const magicLink = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/magic-link/verify?token=${token}`;

  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_PASS:", process.env.SMTP_PASS ? "******" : undefined);

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Sonora" <shriekingyak100@gmail.com>',
    to: email,
    subject: "Your Magic Link to Sign In",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28c75d, #1db954); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #1db954; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 Sonora</h1>
            </div>
            <div class="content">
              <h2>Sign in to your account</h2>
              <p>Click the button below to sign in to your Sonora account. This link will expire in 15 minutes.</p>
              <a href="${magicLink}" class="button">Sign In</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${magicLink}</p>
              <p><strong>If you didn't request this email, you can safely ignore it.</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Sonora. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
