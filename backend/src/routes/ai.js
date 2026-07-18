import { Router } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { updateDb } from "../lib/fileStore.js";
import { requireAuth } from "../middleware/auth.js";
import { explainAnswer, generateStudyQuestions } from "../services/aiService.js";
import { asyncHandler, clampNumber } from "../utils/http.js";

export const aiRouter = Router();

const questionRequestSchema = z.object({
  subject: z.string().min(2).max(60),
  topic: z.string().min(2).max(80).optional(),
  difficulty: z.enum(["facil", "medio", "dificil"]).default("facil"),
  count: z.number().int().min(1).max(10).default(5)
});

const explanationRequestSchema = z.object({
  question: z.string().min(5),
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string()
      })
    )
    .min(2),
  selectedOptionId: z.string(),
  correctOptionId: z.string(),
  baseExplanation: z.string().optional()
});

aiRouter.post(
  "/questions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = questionRequestSchema.parse({
      ...req.body,
      count: clampNumber(req.body.count, 1, 10, 5)
    });

    const result = await generateStudyQuestions(body);
    const questionSet = {
      id: uuid(),
      userId: req.user.id,
      ...body,
      provider: result.provider,
      model: result.model,
      questions: result.questions,
      createdAt: new Date().toISOString()
    };

    await updateDb(async (db) => {
      db.questionSets.push(questionSet);
    });

    res.status(201).json(questionSet);
  })
);

aiRouter.post(
  "/explain",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = explanationRequestSchema.parse(req.body);
    res.json(await explainAnswer(body));
  })
);
