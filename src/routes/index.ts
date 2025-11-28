import * as express from "express";

import albumsRouter from "./api/albums";
import artistsRouter from "./api/artists";
import playlistsRouter from "./api/playlists";
import tracksRouter from "./api/tracks";
import usersRouter from "./api/users";
import likesRouter from "./api/likes";

export const register = (app: express.Application) => {
  app.get("/", (req, res) => {
    res.render("index", { pageTitle: "Music App", content: "pages/home" });
  });

  app.get("/explore", (req, res) => {
    res.render("index", { pageTitle: "Music App", content: "pages/explore" });
  });

  app.get("/songs", (req, res) => {
    res.render("index", { pageTitle: "Music App", content: "pages/songs" });
  });

  app.get("/artists", (req, res) => {
    res.render("index", { pageTitle: "Music App", content: "pages/artists" });
  });

  app.get("/albums", (req, res) => {
    res.render("index", { pageTitle: "Music App", content: "pages/albums" });
  });

  app.get("/playlists", (req, res) => {
    res.render("index", { pageTitle: "Music App", content: "pages/playlists" });
  });

  app.get("/liked", (req, res) => {
    res.render("index", { pageTitle: "Music App", content: "pages/liked" });
  });

  app.get("/episodes", (req, res) => {
    res.render("index", {
      pageTitle: "Music App",
      content: "pages/episodes",
    });
  });

  app.use("/api/albums", albumsRouter);
  app.use("/api/artists", artistsRouter);
  app.use("/api/playlists", playlistsRouter);
  app.use("/api/tracks", tracksRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/likes", likesRouter);
};
