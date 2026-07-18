import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { readDb } from "../lib/fileStore.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Necesitas iniciar sesion." });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const db = await readDb();
    const user = db.users.find((candidate) => candidate.id === payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Sesion invalida." });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Sesion expirada o invalida." });
  }
}
