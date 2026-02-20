import dotenv from "dotenv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "data");
const TEACHER_DB_PATH = join(DATA_DIR, "teacher-portal.json");
const STORAGE_KEY = "teacher_portal";

export const defaultTeacherData = {
  classes: [
    {
      id: "acct-101",
      name: "Accounting 101",
      status: "Active",
      students: ["Ava Kim", "Noah Patel", "Ethan Cruz", "Mia Brooks"],
      assessments: [
        {
          id: "acct-midterm-1",
          title: "Midterm Review Quiz",
          prompt:
            "Create a 12-question mixed-format assessment on journal entries, trial balances, and adjusting entries. Include 2 short scenarios and answer key guidance.",
          keyConcepts: ["Accuracy > 80%", "Completes in 30 mins"],
          files: [],
          scores: [],
          generatedQuiz: null,
        },
        {
          id: "acct-practice-1",
          title: "Reconciliation Practice",
          prompt:
            "Build a practical office reconciliation assessment with a fictional ledger mismatch. Students must identify 3 errors and explain correction steps.",
          keyConcepts: ["Error detection quality", "Correction clarity"],
          files: [],
          scores: [],
          generatedQuiz: null,
        },
      ],
    },
    {
      id: "bio-220",
      name: "Biology 220",
      status: "Active",
      students: ["Liam Ortiz", "Sophia Chen", "Mason Reed"],
      assessments: [
        {
          id: "bio-lab-2",
          title: "Cell Lab Prep",
          prompt:
            "Draft a lab-readiness assessment covering cell structure, microscope handling, and stain safety. Keep language beginner-friendly.",
          keyConcepts: ["Safety adherence", "Vocabulary mastery"],
          files: [],
          scores: [],
          generatedQuiz: null,
        },
      ],
    },
    {
      id: "arch-301",
      name: "Architecture Studio 301",
      status: "Active",
      students: ["Isla Carter", "Lucas Nguyen", "Elena Rossi"],
      assessments: [
        {
          id: "arch-concept-1",
          title: "Concept Design Critique",
          prompt:
            "Generate a rubric-based assessment for concept sketches: spatial logic, function, materials, and clarity of presentation notes.",
          keyConcepts: ["Design rationale", "Functional clarity"],
          files: [],
          scores: [],
          generatedQuiz: null,
        },
      ],
    },
  ],
};

function normalizeTeacherDb(raw) {
  const parsed = raw && typeof raw === "object" ? raw : { classes: [] };

  parsed.classes = (parsed.classes || []).map((classItem) => {
    const normalizedStudents = Array.isArray(classItem.students)
      ? classItem.students
      : Array.from({ length: Number(classItem.students || 0) }, (_, i) => `Student ${i + 1}`);

    const normalizedAssessments = (classItem.assessments || []).map((assessment) => ({
      ...assessment,
      keyConcepts: Array.isArray(assessment.keyConcepts)
        ? assessment.keyConcepts
        : Array.isArray(assessment.kpis)
          ? assessment.kpis
          : [],
      files: Array.isArray(assessment.files) ? assessment.files : [],
      scores: Array.isArray(assessment.scores) ? assessment.scores : [],
      generatedQuiz: assessment.generatedQuiz || null,
    }));

    return {
      ...classItem,
      students: normalizedStudents,
      assessments: normalizedAssessments,
    };
  });

  return parsed;
}

function resolveStorageDriver() {
  const fromEnv = (process.env.STORAGE_DRIVER || "").trim().toLowerCase();
  if (fromEnv === "postgres" || fromEnv === "mysql" || fromEnv === "file") return fromEnv;

  const url = (process.env.DATABASE_URL || "").toLowerCase();
  if (url.startsWith("mysql://")) return "mysql";
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return "postgres";

  return process.env.DATABASE_URL ? "mysql" : "file";
}

function resolveSslConfig() {
  const sslEnabled = String(process.env.DATABASE_SSL || "false").toLowerCase() === "true";
  if (!sslEnabled) return undefined;

  const rejectUnauthorized = String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase() === "true";
  return { rejectUnauthorized };
}

function createFileStore() {
  return {
    type: "file",
    async init() {
      await mkdir(DATA_DIR, { recursive: true });
      try {
        await readFile(TEACHER_DB_PATH, "utf8");
      } catch {
        await writeFile(TEACHER_DB_PATH, JSON.stringify(defaultTeacherData, null, 2));
      }
    },
    async read() {
      await this.init();
      const raw = await readFile(TEACHER_DB_PATH, "utf8");
      return normalizeTeacherDb(JSON.parse(raw));
    },
    async write(data) {
      await this.init();
      await writeFile(TEACHER_DB_PATH, JSON.stringify(data, null, 2));
    },
  };
}

function createPostgresStore() {
  let poolPromise = null;

  async function getPool() {
    if (!poolPromise) {
      poolPromise = import("pg")
        .then(({ Pool }) => {
          return new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: resolveSslConfig(),
          });
        })
        .catch((error) => {
          throw new Error(
            `Failed to load postgres driver. Install backend dependency 'pg'. Original error: ${error.message}`,
          );
        });
    }
    return poolPromise;
  }

  return {
    type: "postgres",
    async init() {
      const pool = await getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const existing = await pool.query("SELECT key FROM app_state WHERE key = $1", [STORAGE_KEY]);
      if (!existing.rows.length) {
        await pool.query(
          "INSERT INTO app_state (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())",
          [STORAGE_KEY, JSON.stringify(defaultTeacherData)],
        );
      }
    },
    async read() {
      const pool = await getPool();
      await this.init();
      const result = await pool.query("SELECT value FROM app_state WHERE key = $1", [STORAGE_KEY]);
      if (!result.rows.length) {
        return normalizeTeacherDb(structuredClone(defaultTeacherData));
      }
      return normalizeTeacherDb(result.rows[0].value);
    },
    async write(data) {
      const pool = await getPool();
      await this.init();
      await pool.query(
        `
        INSERT INTO app_state (key, value, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `,
        [STORAGE_KEY, JSON.stringify(data)],
      );
    },
  };
}

function createMySqlStore() {
  let poolPromise = null;

  async function getPool() {
    if (!poolPromise) {
      poolPromise = import("mysql2/promise")
        .then(({ createPool }) => {
          const url = new URL(process.env.DATABASE_URL);
          const sslEnabled = String(process.env.DATABASE_SSL || "false").toLowerCase() === "true";
          const rejectUnauthorized =
            String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase() === "true";

          return createPool({
            host: url.hostname,
            port: Number(url.port || 3306),
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\//, ""),
            waitForConnections: true,
            connectionLimit: Number(process.env.DATABASE_POOL_SIZE || 10),
            ssl: sslEnabled ? { rejectUnauthorized } : undefined,
          });
        })
        .catch((error) => {
          throw new Error(
            `Failed to load mysql driver. Install backend dependency 'mysql2'. Original error: ${error.message}`,
          );
        });
    }
    return poolPromise;
  }

  return {
    type: "mysql",
    async init() {
      const pool = await getPool();
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS app_state (
          \`key\` VARCHAR(191) PRIMARY KEY,
          \`value\` JSON NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      const [rows] = await pool.execute("SELECT `key` FROM app_state WHERE `key` = ?", [STORAGE_KEY]);
      if (!rows.length) {
        await pool.execute("INSERT INTO app_state (`key`, `value`) VALUES (?, CAST(? AS JSON))", [
          STORAGE_KEY,
          JSON.stringify(defaultTeacherData),
        ]);
      }
    },
    async read() {
      const pool = await getPool();
      await this.init();
      const [rows] = await pool.execute("SELECT `value` FROM app_state WHERE `key` = ?", [STORAGE_KEY]);
      if (!rows.length) {
        return normalizeTeacherDb(structuredClone(defaultTeacherData));
      }

      const rawValue = rows[0].value;
      const parsedValue = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
      return normalizeTeacherDb(parsedValue);
    },
    async write(data) {
      const pool = await getPool();
      await this.init();
      await pool.execute(
        `
        INSERT INTO app_state (\`key\`, \`value\`)
        VALUES (?, CAST(? AS JSON))
        ON DUPLICATE KEY UPDATE
          \`value\` = VALUES(\`value\`),
          updated_at = CURRENT_TIMESTAMP
        `,
        [STORAGE_KEY, JSON.stringify(data)],
      );
    },
  };
}

export function createTeacherStore() {
  const storageDriver = resolveStorageDriver();

  if (storageDriver === "postgres") {
    if (!process.env.DATABASE_URL) {
      throw new Error("STORAGE_DRIVER=postgres but DATABASE_URL is not set.");
    }
    return createPostgresStore();
  }

  if (storageDriver === "mysql") {
    if (!process.env.DATABASE_URL) {
      throw new Error("STORAGE_DRIVER=mysql but DATABASE_URL is not set.");
    }
    return createMySqlStore();
  }

  return createFileStore();
}
