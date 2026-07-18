import { Router } from "express";
import { subjects } from "../data/subjects.js";

export const subjectsRouter = Router();

subjectsRouter.get("/", (req, res) => {
  res.json({ subjects });
});
