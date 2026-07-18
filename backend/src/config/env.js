import dotenv from "dotenv";

dotenv.config();

const rawProvider = process.env.AI_PROVIDER || "auto";

export const env = {
  port: Number(process.env.PORT || 4000),
  appOrigin: process.env.APP_ORIGIN || "*",
  jwtSecret: process.env.JWT_SECRET || "studybattle-dev-secret",
  aiProvider: rawProvider.toLowerCase(),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-5.6"
};

export function getResolvedAiProvider() {
  if (env.aiProvider === "auto") {
    return env.openaiApiKey ? "openai" : "mock";
  }

  return env.aiProvider;
}
