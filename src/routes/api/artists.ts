import { Router, Request, Response } from "express";
import { Album, Albums, Artist, Artists, Track, Tracks } from "@models/index";
import { db } from "@config/database";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newArtist = await Artists.create({
      data: {
        ...req.body,
        created_at: new Date(),
      },
    });

    res.status(201).json(newArtist);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const artists: Artist[] = await Artists.findManyPaginated(
      {},
      Number(limit),
      Number(offset),
    );
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const artistId = req.params.id;

  try {
    const artist: Artist | null = await Artists.findById(artistId);

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json(artist);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/albums", async (req: Request, res: Response) => {
  const artistId = req.params.id;

  try {
    const albums: Album[] = await Albums.findMany({
      artist_id: Number(artistId),
    });

    res.json(albums);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
