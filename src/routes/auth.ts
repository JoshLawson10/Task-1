import { Router, Request, Response } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@config/database";
import { Users } from "@models/index";
import { sendMagicLinkEmail } from "@lib/emailService";
import { isNotAuthenticated } from "@middleware/auth";

const router = Router();

// ============ MAGIC LINK LOGIN ============
router.post("/magic-link", async (req: Request, res: Response) => {
  try {
    const email = req.body.email;

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

    console.log("Magic link email sent.");

    res.render("pages/auth/magic-link-sent", {
      pageTitle: "Check Your Email",
      layout: "layouts/auth",
      email,
    });

    console.log("Rendered magic link sent page.");
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
