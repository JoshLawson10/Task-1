import { Router, Request, Response } from "express";
import { User, Users, Playlist } from "@models/index";
import { upload, deleteOldProfileImage } from "@middleware/upload";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const userData = req.body;

    const newUser: User | null = await Users.create(userData);

    if (!newUser) {
      throw new Error("Failed to create user");
    }

    res.status(201).json(newUser);
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user: User | null = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      console.log("Unauthorized access to /me endpoint");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as User;

    console.log("Fetching current user:", user.user_id);

    res.json(user);
  } catch (error: any) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:userId/playlists", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const playlists: Playlist[] = await Users.playlists(Number(userId));

    res.json(playlists);
  } catch (error: any) {
    console.error("Error fetching user playlists:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put(
  "/:userId",
  upload.single("profile_image"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const userData = req.body;

      if (req.file) {
        const currentUser = await Users.findById(userId);

        if (currentUser?.profile_image_url) {
          deleteOldProfileImage(currentUser.profile_image_url);
        }

        userData.profile_image_url = `/uploads/profile-images/${req.file.filename}`;
      }

      userData.updated_at = new Date().toISOString();

      const updatedUser: boolean = await Users.updateById(userId, userData);

      if (!updatedUser) {
        if (req.file) {
          deleteOldProfileImage(`/uploads/profile-images/${req.file.filename}`);
        }
        throw new Error("User not found or update failed");
      }

      const user = await Users.findById(userId);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user:", error);

      if (req.file) {
        deleteOldProfileImage(
          `/uploads/profile-images/${(req as any).file.filename}`,
        );
      }

      res.status(500).json({ error: error.message });
    }
  },
);

router.delete("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const deletedUser: boolean = await Users.deleteById(userId);

    if (!deletedUser) {
      throw new Error("User not found or delete failed");
    }

    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
