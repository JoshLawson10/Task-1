import { Request, Response, NextFunction } from "express";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated()) {
    return next();
  }

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  res.redirect("/auth/login");
};

export const isNotAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.isAuthenticated()) {
    return next();
  }

  res.redirect("/");
};

export const attachUser = (req: Request, res: Response, next: NextFunction) => {
  res.locals.user = req.user || null;
  next();
};
