import { v4 as uuid } from "uuid";
import { updateDb } from "../lib/fileStore.js";
import { publicUser } from "../utils/http.js";

function calculateLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

function achievementSet(user) {
  return new Set(user.achievements || []);
}

function updateAchievements(user) {
  const achievements = achievementSet(user);

  if (user.xp >= 100) achievements.add("primer_nivel");
  if (user.coins >= 100) achievements.add("tesorero");
  if (Object.keys(user.subjects || {}).length >= 3) achievements.add("explorador");
  if (Object.values(user.subjects || {}).some((subject) => subject.correct >= 10)) {
    achievements.add("especialista");
  }

  user.achievements = [...achievements];
}

export async function recordAnswer({ userId, subject, isCorrect, questionId, selectedOptionId }) {
  return updateDb(async (db) => {
    const user = db.users.find((candidate) => candidate.id === userId);
    if (!user) {
      const error = new Error("Usuario no encontrado.");
      error.status = 404;
      throw error;
    }

    const reward = {
      xp: isCorrect ? 20 : 5,
      coins: isCorrect ? 10 : 2
    };

    user.xp += reward.xp;
    user.coins += reward.coins;
    user.level = calculateLevel(user.xp);
    user.streak = isCorrect ? (user.streak || 0) + 1 : 0;
    user.subjects[subject] ||= {
      answered: 0,
      correct: 0,
      xp: 0
    };

    user.subjects[subject].answered += 1;
    user.subjects[subject].correct += isCorrect ? 1 : 0;
    user.subjects[subject].xp += reward.xp;
    user.updatedAt = new Date().toISOString();
    updateAchievements(user);

    const answer = {
      id: uuid(),
      userId,
      subject,
      questionId,
      selectedOptionId,
      isCorrect,
      reward,
      createdAt: new Date().toISOString()
    };

    db.answers.push(answer);

    return {
      answer,
      reward,
      user: publicUser(user)
    };
  });
}
