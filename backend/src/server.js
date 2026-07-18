import cors from "cors";
import express from "express";
import morgan from "morgan";
import { ZodError } from "zod";
import { env, getResolvedAiProvider } from "./config/env.js";
import { aiRouter } from "./routes/ai.js";
import { authRouter } from "./routes/auth.js";
import { progressRouter } from "./routes/progress.js";
import { rankingRouter } from "./routes/ranking.js";
import { subjectsRouter } from "./routes/subjects.js";
import { usersRouter } from "./routes/users.js";

const app = express();

app.use(cors({ origin: env.appOrigin === "*" ? "*" : env.appOrigin.split(",") }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "StudyBattle AI",
    aiProvider: getResolvedAiProvider(),
    model: getResolvedAiProvider() === "openai" ? env.openaiModel : "mock-studybattle"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/progress", progressRouter);
app.use("/api/ranking", rankingRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada." });
});

app.use((error, req, res, next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Datos invalidos.",
      details: error.flatten()
    });
  }

  const status = error.status || 500;
  res.status(status).json({
    message: error.message || "Error interno del servidor."
  });
});

app.listen(env.port, () => {
  console.log(`StudyBattle backend listo en http://localhost:${env.port}`);
});
