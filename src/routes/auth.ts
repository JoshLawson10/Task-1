import { Router, Request, Response } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@config/database";
import { Users } from "@models/index";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMagicLinkEmail,
} from "@lib/emailService";
import { isNotAuthenticated } from "@middleware/auth";

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

// ============ MAGIC LINK LOGIN ============

router.post("/magic-link", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    console.log("Registering user via magic link with email:", email);

    if (!email) {
      return res.redirect("/auth/login?error=Email is required");
    }

    let user = await Users.findUnique({ email: email });

    if (!user) {
      const result = await Users.create({
        email: email,
        auth_provider: "magic_link",
        email_verified: true,
      });

      if (!result) throw new Error("Error creating new user");

      user = await Users.findById(result.user_id);
    }

    if (!user) throw new Error("Error creating new user");

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "15m" },
    );

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db.run(
      "INSERT INTO magic_link_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user!.user_id, token, expiresAt],
    );

    await sendMagicLinkEmail(email, token);

    res.render("pages/auth/magic-link-sent", {
      pageTitle: "Check Your Email",
      layout: "layouts/auth",
      email,
    });
  } catch (error) {
    console.error("Magic link error:", error);
    res.redirect("/auth/login?error=Something went wrong");
  }
});

router.get("/magic-link/verify", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect("/auth/login?error=Invalid magic link");
    }

    const decoded = jwt.verify(
      token as string,
      process.env.JWT_SECRET || "your-secret-key",
    ) as { user_id: number };

    const tokenRecord = await db.get<any>(
      "SELECT * FROM magic_link_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')",
      token,
    );

    if (!tokenRecord) {
      return res.redirect("/auth/login?error=Invalid or expired magic link");
    }

    await db.run(
      "UPDATE magic_link_tokens SET used = 1 WHERE token = ?",
      token,
    );

    const user = await Users.findById(decoded.user_id);

    if (!user) {
      return res.redirect("/auth/login?error=User not found");
    }

    req.login(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.redirect("/auth/login?error=Login failed");
      }
      res.redirect("/");
    });
  } catch (error) {
    console.error("Magic link verification error:", error);
    res.redirect("/auth/login?error=Invalid magic link");
  }
});

// ============ PASSWORD RESET ============

router.get("/forgot-password", isNotAuthenticated, (req, res) => {
  res.render("pagesauth/forgot-password", {
    pageTitle: "Forgot Password",
    layout: "layouts/auth",
  });
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await Users.findUnique({
      email: email,
      auth_provider: "local",
    });

    if (!user) {
      return res.render("pages/auth/reset-sent", {
        pageTitle: "Reset Email Sent",
        layout: "layouts/auth",
        email,
      });
    }

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" },
    );

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await db.run(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.user_id, token, expiresAt],
    );

    await sendPasswordResetEmail(email, token);

    res.render("pages/auth/reset-sent", {
      pageTitle: "Reset Email Sent",
      layout: "layouts/auth",
      email,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.redirect("/auth/forgot-password?error=Something went wrong");
  }
});

router.get("/reset-password", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect("/auth/login?error=Invalid reset link");
  }

  try {
    jwt.verify(token as string, process.env.JWT_SECRET || "your-secret-key");

    const tokenRecord = await db.get<any>(
      "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')",
      token,
    );

    if (!tokenRecord) {
      return res.redirect("/auth/login?error=Invalid or expired reset link");
    }

    res.render("pages/auth/reset-password", {
      pageTitle: "Reset Password",
      layout: "layouts/auth",
      token,
    });
  } catch (error) {
    res.redirect("/auth/login?error=Invalid reset link");
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password, confirm_password } = req.body;

    if (!token || !password) {
      return res.redirect("/auth/login?error=Invalid request");
    }

    if (password !== confirm_password) {
      return res.redirect(
        `/auth/reset-password?token=${token}&error=Passwords do not match`,
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    ) as { user_id: number };

    const tokenRecord = await db.get<any>(
      "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')",
      token,
    );

    if (!tokenRecord) {
      return res.redirect("/auth/login?error=Invalid or expired reset link");
    }

    const password_hash = await bcrypt.hash(password, 10);

    await Users.updateById(decoded.user_id, { password_hash: password_hash });

    await db.run(
      "UPDATE password_reset_tokens SET used = 1 WHERE token = ?",
      token,
    );

    res.redirect("/auth/login?success=Password reset successfully");
  } catch (error) {
    console.error("Password reset error:", error);
    res.redirect("/auth/login?error=Something went wrong");
  }
});

// ============ GOOGLE OAUTH ============
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/auth/login?error=Google authentication failed",
  }),
);

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
