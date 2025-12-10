import * as express from "express";

import { isAuthenticated, isNotAuthenticated } from "@middleware/auth";
import authRouter from "./auth";

import albumsRouter from "./api/albums";
import artistsRouter from "./api/artists";
import playlistsRouter from "./api/playlists";
import tracksRouter from "./api/tracks";
import usersRouter from "./api/users";
import likesRouter from "./api/likes";

export const register = (app: express.Application) => {
  app.get("/auth", isNotAuthenticated, (req, res) => {
    app.set("layout", "layouts/auth");
    res.render("auth", { pageTitle: "Sonora", content: "pages/auth/auth" });
  });

  app.get("/auth/onboarding", (req, res) => {
    res.redirect("/api/auth/onboarding");
  });

  app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect("/home");
    }
    res.redirect("/auth");
  });

  app.get("/home", isAuthenticated, (req, res) => {
    app.set("layout", "layouts/app");
    res.render("index", { pageTitle: "Sonora", content: "pages/home" });
  });

  app.get("/explore", isAuthenticated, (req, res) => {
    app.set("layout", "layouts/app");
    res.render("index", { pageTitle: "Sonora", content: "pages/explore" });
  });

  app.get("/songs", isAuthenticated, (req, res) => {
    app.set("layout", "layouts/app");
    res.render("index", { pageTitle: "Sonora", content: "pages/songs" });
  });

  app.get("/artists", isAuthenticated, (req, res) => {
    app.set("layout", "layouts/app");
    res.render("index", { pageTitle: "Sonora", content: "pages/artists" });
  });

  app.get("/albums", isAuthenticated, (req, res) => {
    app.set("layout", "layouts/app");
    res.render("index", { pageTitle: "Sonora", content: "pages/albums" });
  });

  app.get("/playlists", isAuthenticated, (req, res) => {
    app.set("layout", "layouts/app");
    res.render("index", { pageTitle: "Sonora", content: "pages/playlists" });
  });

  app.get("/liked", isAuthenticated, (req, res) => {
    app.set("layout", "layouts/app");
    res.render("index", { pageTitle: "Sonora", content: "pages/liked" });
  });

  app.get("/episodes", isAuthenticated, (req, res) => {
    app.set("layout", "layouts/app");
    res.render("index", {
      pageTitle: "Sonora",
      content: "pages/episodes",
    });
  });

  app.use("/api/auth", authRouter);

  app.use("/api/albums", isAuthenticated, albumsRouter);
  app.use("/api/artists", isAuthenticated, artistsRouter);
  app.use("/api/playlists", isAuthenticated, playlistsRouter);
  app.use("/api/tracks", isAuthenticated, tracksRouter);
  app.use("/api/users", isAuthenticated, usersRouter);
  app.use("/api/likes", isAuthenticated, likesRouter);
};
