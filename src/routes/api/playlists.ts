import { Router, Request, Response } from "express";
import {
  Playlist,
  Playlists,
  Track,
  Tracks,
  PlaylistTracks,
  PlaylistTrack,
} from "@models/index";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { name, is_public } = req.body;

  if (!name || is_public === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newPlaylist: Playlist | null = await Playlists.create({
      data: {
        ...req.body,
        created_at: new Date().toISOString(),
      },
    });

    res.status(201).json(newPlaylist);
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/tracks", async (req: Request, res: Response) => {
  const playlistId = req.params.id;
  const { track_id, added_by } = req.body;

  if (!track_id || !added_by) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newPlaylistTrack: PlaylistTrack | null = await Playlists.addTrack(
      Number(playlistId),
      Number(track_id),
      Number(added_by),
    );

    res.status(201).json(newPlaylistTrack);
  } catch (error) {
    console.error("Error adding track to playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/public", async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const playlists: Playlist[] = await Playlists.findManyPaginated(
      { is_public: true },
      Number(limit),
      Number(offset),
    );

    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const playlistId = req.params.id;

  try {
    const playlist: Playlist | null = await Playlists.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const tracks: Track[] = await Playlists.tracks(Number(playlistId));

    res.json({ playlist, tracks });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const playlistId = req.params.id;
  const { name, is_public } = req.body;

  if (!name || is_public === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const updatedPlaylist: boolean = await Playlists.update(
      { playlist_id: Number(playlistId) },
      {
        ...req.body,
        updated_at: new Date().toISOString(),
      },
    );

    if (!updatedPlaylist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    res.json(updatedPlaylist);
  } catch (error) {
    console.error("Error updating playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const playlistId = req.params.id;

  try {
    const deletedPlaylist: boolean = await Playlists.delete({
      playlist_id: Number(playlistId),
    });

    if (!deletedPlaylist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    res.json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id/tracks/:trackId", async (req: Request, res: Response) => {
  const playlistId = req.params.id;
  const trackId = req.params.trackId;

  try {
    const deletedPlaylistTrack: boolean = await PlaylistTracks.delete({
      playlist_id: Number(playlistId),
      track_id: Number(trackId),
    });

    if (!deletedPlaylistTrack) {
      return res.status(404).json({ error: "Track in playlist not found" });
    }

    res.json({ message: "Track removed from playlist successfully" });
  } catch (error) {
    console.error("Error removing track from playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/reorder", async (req: Request, res: Response) => {
  const playlistId = req.params.id;
  const { track_orders } = req.body;

  if (!Array.isArray(track_orders)) {
    return res.status(400).json({ error: "Invalid track_orders format" });
  }

  try {
    for (const { track_id, position } of track_orders) {
      await PlaylistTracks.update(
        { playlist_id: Number(playlistId), track_id: Number(track_id) },
        { position: Number(position) },
      );
    }

    res.json({ message: "Track order updated successfully" });
  } catch (error) {
    console.error("Error reordering tracks in playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
