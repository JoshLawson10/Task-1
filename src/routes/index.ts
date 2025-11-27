import * as express from "express";

import albumsRouter from "./api/albums";
import artistsRouter from "./api/artists";
import playlistsRouter from "./api/playlists";
import tracksRouter from "./api/tracks";
import usersRouter from "./api/users";

export const register = (app: express.Application) => {
  app.get("/", (req, res) => {
    res.render("index");
  });

  app.get("/about", (req, res) => {
    res.render("about");
  });

  app.use("/api/albums", albumsRouter);
  app.use("/api/artists", artistsRouter);
  app.use("/api/playlists", playlistsRouter);
  app.use("/api/tracks", tracksRouter);
  app.use("/api/users", usersRouter);
};
