import { Router, Request, Response } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@config/database";
import { Users } from "@models/index";
import { sendVerificationEmail } from "@lib/emailService";

const router = Router();

// ============ LOCAL LOGIN ============

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/auth/login?error=Invalid credentials",
  }),
);

// ============ LOCAL SIGNUP ============

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, display_name } = req.body;

    console.log("Attempting signup for email:", email);

    if (!email || !password || !display_name) {
      return res.redirect("/auth/register?error=All fields are required");
    }

    const existingUser = await Users.findUnique({ email: email });

    if (existingUser) {
      return res.redirect("/auth/register?error=Email already registered");
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await Users.create({
      email: email,
      password_hash: password_hash,
      display_name: display_name,
      auth_provider: "local",
      email_verified: true,
    });

    if (!result) {
      console.log("No result when creating new user");
      throw new Error("Error creating new user!");
    }

    const token = jwt.sign(
      { user_id: result.user_id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.run(
      "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [result.user_id, token, expiresAt],
    );

    console.log("Sending verification email");

    await sendVerificationEmail(email, token);

    console.log("Verification email set.");

    res.render("pages/auth/verify-sent", {
      pageTitle: "Verify Email",
      email,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.redirect("/auth/register?error=Something went wrong");
  }
});

// ============ EMAIL VERIFICATION ============

router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect("/auth/login?error=Invalid verification link");
    }

    const decoded = jwt.verify(
      token as string,
      process.env.JWT_SECRET || "your-secret-key",
    ) as { user_id: number };

    const tokenRecord = await db.get<any>(
      "SELECT * FROM email_verification_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')",
      token,
    );

    if (!tokenRecord) {
      return res.redirect(
        "/auth/login?error=Invalid or expired verification link",
      );
    }

    await Users.updateById(decoded.user_id, { email_verified: true });

    await db.run(
      "UPDATE email_verification_tokens SET used = 1 WHERE token = ?",
      token,
    );

    res.render("pages/auth/verified", {
      pageTitle: "Email Verified",
      layout: "layouts/auth",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.redirect("/auth/login?error=Invalid verification link");
  }
});

// ============ LOGOUT ============

router.get("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/auth/login");
  });
});

export default router;
