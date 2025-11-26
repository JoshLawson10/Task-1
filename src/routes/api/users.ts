import { Router, Request, Response } from "express";
import { User, Users } from "@models/index";
import { db } from "@config/database";

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

router.put("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userData = req.body;

    const updatedUser: boolean = await Users.updateById(userId, userData);

    if (!updatedUser) {
      throw new Error("User not found or update failed");
    }

    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: error.message });
  }
});

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
