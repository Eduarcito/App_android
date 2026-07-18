import { Router } from "express";
import { readDb } from "../lib/fileStore.js";
import { publicUser } from "../utils/http.js";

export const rankingRouter = Router();

rankingRouter.get("/", async (req, res) => {
  const db = await readDb();
  const ranking = db.users
    .map(publicUser)
    .sort((a, b) => b.xp - a.xp || b.level - a.level || b.coins - a.coins)
    .slice(0, 50)
    .map((user, index) => ({
      position: index + 1,
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      xp: user.xp,
      level: user.level,
      coins: user.coins,
      achievements: user.achievements
    }));

  res.json({ ranking });
});
