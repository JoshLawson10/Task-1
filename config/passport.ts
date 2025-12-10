import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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
