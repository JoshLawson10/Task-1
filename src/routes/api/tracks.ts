import { Router, Request, Response } from "express";
import { Track, Tracks } from "@models/index";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const tracks: Track[] = await Tracks.findManyPaginated(
      {},
      Number(limit),
      Number(offset),
    );

    const tracksExtra = [];

    for (const track of tracks) {
      const album = await Tracks.album(track.track_id);
      const artist = await Tracks.artist(track.track_id);
      const cover_image_url = await Tracks.cover_image_url(track.track_id);
      tracksExtra.push({
        ...track,
        album_name: album ? album.album_title : null,
        artist_name: artist ? artist.artist_name : null,
        cover_image_url: cover_image_url ? cover_image_url : null,
      });
    }

    res.json(tracksExtra);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/popular", async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.query;

    const tracks: Track[] = await Tracks.popular(Number(limit));

    res.json(tracks);
  } catch (error) {
    console.error("Error fetching popular tracks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const trackId = Number(req.params.id);
    const track: Track | null = await Tracks.findById(trackId);

    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    const album = await Tracks.album(trackId);
    const artist = await Tracks.artist(trackId);
    const cover_image_url = await Tracks.cover_image_url(trackId);

    const trackExtra = {
      ...track,
      album_name: album ? album.album_title : null,
      artist_name: artist ? artist.artist_name : null,
      cover_image_url: cover_image_url ? cover_image_url : null,
    };

    res.json(trackExtra);
  } catch (error) {
    console.error("Error fetching track:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/play", async (req: Request, res: Response) => {
  try {
    const trackId = Number(req.params.id);
    await Tracks.play(trackId);

    res.json({ message: "Track play count incremented" });
  } catch (error) {
    console.error("Error updating track play count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
