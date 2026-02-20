import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createTeacherStore } from "../teacherStore.js";

dotenv.config();

async function main() {
  process.env.STORAGE_DRIVER = process.env.STORAGE_DRIVER || "mysql";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed database.");
  }

  const localPath = join(process.cwd(), "data", "teacher-portal.json");
  const raw = await readFile(localPath, "utf8");
  const parsed = JSON.parse(raw);

  const store = createTeacherStore();
  await store.write(parsed);

  console.log(`Seeded ${process.env.STORAGE_DRIVER} from ${localPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
