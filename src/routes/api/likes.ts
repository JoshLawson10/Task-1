import { Router, Request, Response } from "express";
import { Users, Track } from "@models/index";

const router = Router();

router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const likedTracks: Track[] = await Users.likedTracks(Number(userId));

    res.json(likedTracks);
  } catch (error: any) {
    console.error("Error fetching liked tracks:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get(
  "/user/:userId/track/:trackId",
  async (req: Request, res: Response) => {
    try {
      const { userId, trackId } = req.params;

      const isLiked = await Users.isTrackLiked(Number(userId), Number(trackId));

      res.json({ isLiked });
    } catch (error: any) {
      console.error("Error checking liked status:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.post(
  "/user/:userId/track/:trackId",
  async (req: Request, res: Response) => {
    try {
      const { userId, trackId } = req.params;

      const result = await Users.likeTrack(Number(userId), Number(trackId));

      if (!result) {
        return res.status(400).json({ error: "Track already liked" });
      }

      res
        .status(201)
        .json({ message: "Track liked successfully", liked: true });
    } catch (error: any) {
      console.error("Error liking track:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.delete(
  "/user/:userId/track/:trackId",
  async (req: Request, res: Response) => {
    try {
      const { userId, trackId } = req.params;

      const result = await Users.unlikeTrack(Number(userId), Number(trackId));

      if (!result) {
        return res.status(404).json({ error: "Like not found" });
      }

      res.json({ message: "Track unliked successfully", liked: false });
    } catch (error: any) {
      console.error("Error unliking track:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
