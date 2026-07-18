import { Router } from "express";
import { z } from "zod";
import { updateDb } from "../lib/fileStore.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, publicUser } from "../utils/http.js";

export const usersRouter = Router();

const avatarSchema = z.object({
  archetype: z.string().min(2).max(30),
  color: z.string().min(2).max(30),
  accessory: z.string().min(2).max(30).default("none")
});

usersRouter.patch(
  "/me/avatar",
  requireAuth,
  asyncHandler(async (req, res) => {
    const avatar = avatarSchema.parse(req.body);

    const user = await updateDb(async (db) => {
      const storedUser = db.users.find((candidate) => candidate.id === req.user.id);
      storedUser.avatar = avatar;
      storedUser.updatedAt = new Date().toISOString();
      return publicUser(storedUser);
    });

    res.json({ user });
  })
);
