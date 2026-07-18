import fs from "node:fs/promises";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "data");
const dbFile = path.join(dataDir, "studybattle.json");

const initialDb = {
  users: [],
  questionSets: [],
  answers: [],
  duels: []
};

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dbFile);
  } catch {
    await fs.writeFile(dbFile, JSON.stringify(initialDb, null, 2));
  }
}

export async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(dbFile, "utf8");
  return JSON.parse(raw);
}

export async function writeDb(db) {
  await ensureDb();
  await fs.writeFile(dbFile, JSON.stringify(db, null, 2));
}

export async function updateDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}
