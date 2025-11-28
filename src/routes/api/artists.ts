import { Router, Request, Response } from "express";
import { Album, Artist, Artists } from "@models/index";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { artist_name } = req.body;

  if (!artist_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newArtist = await Artists.create({
      artist_name,
      bio: req.body.bio,
      profile_image_url: req.body.profile_image_url,
      created_at: new Date().toISOString(),
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
    const albums: Album[] = await Artists.albums(Number(artistId));

    res.json(albums);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
