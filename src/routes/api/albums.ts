import { Router, Request, Response } from "express";
import { Album, Albums, Artist, Artists, Track, Tracks } from "@models/index";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { artist_id, title, release_year, cover_image_url } = req.body;

  if (!artist_id || !title || !release_year || !cover_image_url) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const albumData: Partial<Album> = {
    artist_id: artist_id,
    album_title: title,
    release_year: release_year,
    cover_image_url: cover_image_url,
    created_at: new Date().toISOString(),
  };

  try {
    const newAlbum: Album | null = await Albums.create(albumData);

    res.status(201).json(newAlbum);
  } catch (error) {
    console.error("Error creating album:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  const { limit = 50, offset = 0 } = req.query;

  const albums: Album[] = await Albums.findManyPaginated(
    {},
    Number(limit),
    Number(offset),
  );

  res.json(albums);
});

router.get("/:id", async (req: Request, res: Response) => {
  const albumId = req.params.id;

  try {
    const album: Album | null = await Albums.findById(albumId);

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    const artist: Artist | null = await Artists.findById(album.artist_id);

    res.json({ ...album, artist });
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

    const tracks: Track[] = await Tracks.findMany({
      album_id: Number(albumId),
    });

    res.json(tracks);
  } catch (error) {
    console.error("Error fetching album tracks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
