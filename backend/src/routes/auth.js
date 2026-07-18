import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { loginUser, registerUser } from "../services/authService.js";
import { asyncHandler, publicUser } from "../utils/http.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = credentialsSchema.extend({
  name: z.string().min(2).max(50)
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    res.status(201).json(await registerUser(payload));
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = credentialsSchema.parse(req.body);
    res.json(await loginUser(payload));
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  })
);
