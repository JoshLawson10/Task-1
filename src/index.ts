import "dotenv/config";

import * as fs from "fs";
import express from "express";
import expressEjsLayouts from "express-ejs-layouts";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import logger from "morgan";
import passport from "@config/passport";
import * as routes from "./routes/index";
import { attachUser } from "@middleware/auth";

const app = express();
const port = process.env.PORT || 3000;

// ---------- Database Init ----------
import { db, database, initDatabase } from "@config/database";

initDatabase();
app.locals.db = db;
app.locals.database = database;

// ---------- Ensure Uploads Directory Exists ----------
const uploadsDir = path.join(__dirname, "../uploads/profile-images");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✓ Created uploads directory:", uploadsDir);
} else {
  console.log("✓ Uploads directory already exists:", uploadsDir);
}

const gitkeepPath = path.join(uploadsDir, ".gitkeep");
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, "");
  console.log("✓ Created .gitkeep file");
}

console.log("✓ Upload directory setup complete!");

// ---------- CORS Middleware ----------
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ---------- Middleware & View Engine ----------
app.set("port", port);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use(attachUser);

app.use(expressEjsLayouts);
app.set("layout", "layouts/app");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ---------- Routes ----------
routes.register(app);

// ---------- Errors and 404 Handling ----------
app.use((req, res, next) => {
  const err = new Error("Not Found");
  (err as any).status = 404;
  next(err);
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    console.log(err.message);

    res.status(err.status || 500);
    res.redirect("/");
  },
);

// ---------- Server Setup ----------
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
