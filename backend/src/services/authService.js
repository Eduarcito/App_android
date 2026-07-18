import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../config/env.js";
import { updateDb } from "../lib/fileStore.js";
import { publicUser } from "../utils/http.js";

function createToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: "7d" });
}

export async function registerUser({ email, password, name }) {
  const normalizedEmail = email.trim().toLowerCase();

  return updateDb(async (db) => {
    const existing = db.users.find((user) => user.email === normalizedEmail);
    if (existing) {
      const error = new Error("Ese correo ya esta registrado.");
      error.status = 409;
      throw error;
    }

    const now = new Date().toISOString();
    const user = {
      id: uuid(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      name: name.trim(),
      avatar: {
        archetype: "aprendiz",
        color: "blue",
        accessory: "none"
      },
      xp: 0,
      coins: 0,
      level: 1,
      streak: 0,
      subjects: {},
      achievements: [],
      createdAt: now,
      updatedAt: now
    };

    db.users.push(user);

    return {
      token: createToken(user.id),
      user: publicUser(user)
    };
  });
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  return updateDb(async (db) => {
    const user = db.users.find((candidate) => candidate.email === normalizedEmail);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      const error = new Error("Correo o contrasena incorrectos.");
      error.status = 401;
      throw error;
    }

    return {
      token: createToken(user.id),
      user: publicUser(user)
    };
  });
}
