import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { recordAnswer } from "../services/gameService.js";
import { asyncHandler } from "../utils/http.js";

export const progressRouter = Router();

const answerSchema = z.object({
  subject: z.string().min(2).max(60),
  questionId: z.string().optional(),
  selectedOptionId: z.string().optional(),
  isCorrect: z.boolean()
});

progressRouter.post(
  "/answer",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = answerSchema.parse(req.body);
    const result = await recordAnswer({
      userId: req.user.id,
      ...body
    });

    res.status(201).json(result);
  })
);
