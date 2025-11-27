import { Router, Request, Response } from "express";
import { Album, Albums, Track } from "@models/index";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { artist_id, album_title } = req.body;

  if (!artist_id || !album_title) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newAlbum: Album | null = await Albums.create({
      artist_id,
      album_title,
      release_year: req.body.release_year,
      cover_image_url: req.body.cover_image_url,
      created_at: new Date().toISOString(),
    });

    res.status(201).json(newAlbum);
  } catch (error) {
    console.error("Error creating album:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const albums: Album[] = await Albums.findManyPaginated(
      {},
      Number(limit),
      Number(offset),
    );

    res.json(albums);
  } catch (error) {
    console.error("Error fetching albums:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const albumId = req.params.id;

  try {
    const album: Album | null = await Albums.findById(albumId);

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    res.json(album);
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/tracks", async (req: Request, res: Response) => {
  const albumId = req.params.id;

  try {
    const album: Album | null = await Albums.findById(albumId);

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    const tracks: Track[] = await Albums.tracks(Number(albumId));

    res.json(tracks);
  } catch (error) {
    console.error("Error fetching album tracks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
