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

    res.json(tracks);
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

    res.json(track);
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
