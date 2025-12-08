import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { db } from "./database";
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

export default passport;
