import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import { Users } from "@models/index";

passport.serializeUser((user: any, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await Users.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      console.log("Authenticating user with email:", email);
      try {
        const user = await Users.findUnique({ email: email });

        if (!user) {
          console.log("No user found with email:", email);
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.email_verified) {
          console.log("Email not verified for user:", email);
          return done(null, false, {
            message: "Please verify your email first",
          });
        }

        if (!user.password_hash) {
          console.log("User has no password hash:", email);
          return done(null, false, { message: "Invalid login method" });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
          console.log("Password mismatch for user:", email);
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await Users.findById(profile.id);

        if (user) {
          return done(null, user);
        }

        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await Users.findUnique({ email: email });

          if (user) {
            await Users.updateById(user.user_id, {
              google_id: profile.id,
              auth_provider: "google",
              email_verified: true,
            });

            return done(null, user);
          }
        }

        const result = await Users.create({
          email: email || `${profile.id}@google.oauth`,
          display_name: profile.displayName,
          profile_image_url: profile.photos?.[0]?.value,
          google_id: profile.id,
          auth_provider: "google",
          email_verified: true,
        });

        if (!result) throw new Error("Error creating new user!");

        return done(null, result);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
