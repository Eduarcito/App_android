import OpenAI from "openai";
import { v4 as uuid } from "uuid";
import { env, getResolvedAiProvider } from "../config/env.js";

const optionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", enum: ["A", "B", "C", "D"] },
    text: { type: "string" }
  },
  required: ["id", "text"]
};

const questionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject: { type: "string" },
    topic: { type: "string" },
    difficulty: { type: "string", enum: ["facil", "medio", "dificil"] },
    prompt: { type: "string" },
    options: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: optionSchema
    },
    correctOptionId: { type: "string", enum: ["A", "B", "C", "D"] },
    explanation: { type: "string" },
    xp: { type: "number" }
  },
  required: [
    "subject",
    "topic",
    "difficulty",
    "prompt",
    "options",
    "correctOptionId",
    "explanation",
    "xp"
  ]
};

const questionsResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: questionSchema
    }
  },
  required: ["questions"]
};

const explanationResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    isCorrect: { type: "boolean" },
    explanation: { type: "string" },
    studyTip: { type: "string" }
  },
  required: ["isCorrect", "explanation", "studyTip"]
};

function getOpenAIClient() {
  if (!env.openaiApiKey) {
    const error = new Error("Falta OPENAI_API_KEY en backend/.env.");
    error.status = 503;
    throw error;
  }

  return new OpenAI({ apiKey: env.openaiApiKey });
}

function withIds(questions) {
  return questions.map((question) => ({
    id: uuid(),
    ...question,
    xp: Number(question.xp || 20)
  }));
}

function buildMockQuestions({ subject, topic = "general", difficulty = "facil", count = 5 }) {
  const templates = [
    {
      prompt: `En ${subject}, cual es la mejor estrategia para empezar a estudiar ${topic}?`,
      options: [
        { id: "A", text: "Leer sin revisar ideas principales" },
        { id: "B", text: "Identificar conceptos clave y practicar con ejemplos" },
        { id: "C", text: "Memorizar todo sin descanso" },
        { id: "D", text: "Evitar resolver ejercicios" }
      ],
      correctOptionId: "B",
      explanation: "Identificar conceptos clave y practicar ayuda a convertir la teoria en habilidad."
    },
    {
      prompt: `Que accion demuestra mejor comprension de un tema de ${subject}?`,
      options: [
        { id: "A", text: "Explicarlo con tus propias palabras" },
        { id: "B", text: "Copiar una definicion sin entenderla" },
        { id: "C", text: "Saltar los ejercicios dificiles" },
        { id: "D", text: "Adivinar respuestas al azar" }
      ],
      correctOptionId: "A",
      explanation: "Explicar con tus propias palabras muestra que ya organizaste la idea mentalmente."
    }
  ];

  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length];
    return {
      id: uuid(),
      subject,
      topic,
      difficulty,
      prompt: template.prompt,
      options: template.options,
      correctOptionId: template.correctOptionId,
      explanation: template.explanation,
      xp: difficulty === "dificil" ? 30 : difficulty === "medio" ? 25 : 20
    };
  });
}

export async function generateStudyQuestions(input) {
  const provider = getResolvedAiProvider();

  if (provider === "mock") {
    return {
      provider,
      model: "mock-studybattle",
      questions: buildMockQuestions(input)
    };
  }

  if (provider !== "openai") {
    const error = new Error(`Proveedor de IA no soportado: ${provider}`);
    error.status = 400;
    throw error;
  }

  const client = getOpenAIClient();
  const count = input.count || 5;
  const topic = input.topic || "general";
  const difficulty = input.difficulty || "facil";

  const response = await client.responses.create({
    model: env.openaiModel,
    store: false,
    input: [
      {
        role: "system",
        content:
          "Eres un generador de preguntas para una app educativa gamificada. Genera preguntas claras, correctas y aptas para estudiantes. No incluyas contenido ofensivo ni datos inventados como hechos historicos dudosos."
      },
      {
        role: "user",
        content: `Genera ${count} preguntas de opcion multiple en espanol. Materia: ${input.subject}. Tema: ${topic}. Dificultad: ${difficulty}. Cada pregunta debe tener 4 opciones, una respuesta correcta y una explicacion breve.`
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "studybattle_questions",
        strict: true,
        schema: questionsResponseSchema
      }
    }
  });

  const parsed = JSON.parse(response.output_text);

  return {
    provider,
    model: env.openaiModel,
    questions: withIds(parsed.questions)
  };
}

export async function explainAnswer(input) {
  const provider = getResolvedAiProvider();

  if (provider === "mock") {
    return {
      provider,
      model: "mock-studybattle",
      isCorrect: input.selectedOptionId === input.correctOptionId,
      explanation: input.baseExplanation || "Revisa la idea principal y compara cada opcion antes de responder.",
      studyTip: "Haz una mini tarjeta de estudio con la regla o concepto que fallo."
    };
  }

  if (provider !== "openai") {
    const error = new Error(`Proveedor de IA no soportado: ${provider}`);
    error.status = 400;
    throw error;
  }

  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: env.openaiModel,
    store: false,
    input: [
      {
        role: "system",
        content:
          "Eres un tutor paciente. Explica respuestas con lenguaje claro, breve y motivador. No reveles informacion innecesaria."
      },
      {
        role: "user",
        content: JSON.stringify({
          question: input.question,
          options: input.options,
          selectedOptionId: input.selectedOptionId,
          correctOptionId: input.correctOptionId,
          baseExplanation: input.baseExplanation
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "studybattle_explanation",
        strict: true,
        schema: explanationResponseSchema
      }
    }
  });

  return {
    provider,
    model: env.openaiModel,
    ...JSON.parse(response.output_text)
  };
}
