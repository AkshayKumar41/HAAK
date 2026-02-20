import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));

const PORT = Number(process.env.PORT || 3001);
const REGION = process.env.OCI_REGION || "us-chicago-1";
const BASE = `https://inference.generativeai.${REGION}.oci.oraclecloud.com/20231130/actions/v1`;
const KEY = process.env.OCI_GENAI_API_KEY;
const DEFAULT_MODEL = process.env.OCI_MODEL || "meta.llama-3.3-70b-instruct";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "data");
const TEACHER_DB_PATH = join(DATA_DIR, "teacher-portal.json");

const defaultTeacherData = {
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
        },
        {
          id: "acct-practice-1",
          title: "Reconciliation Practice",
          prompt:
            "Build a practical office reconciliation assessment with a fictional ledger mismatch. Students must identify 3 errors and explain correction steps.",
          keyConcepts: ["Error detection quality", "Correction clarity"],
          files: [],
          scores: [],
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
        },
      ],
    },
  ],
};

if (!KEY) {
  console.warn("OCI_GENAI_API_KEY is missing. /api/chat will be disabled until key is set.");
}

async function ensureTeacherDb() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(TEACHER_DB_PATH, "utf8");
  } catch {
    await writeFile(TEACHER_DB_PATH, JSON.stringify(defaultTeacherData, null, 2));
  }
}

async function readTeacherDb() {
  await ensureTeacherDb();
  const raw = await readFile(TEACHER_DB_PATH, "utf8");
  const parsed = JSON.parse(raw);

  // Backward-compatible normalization for older local data shape.
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
    }));

    return {
      ...classItem,
      students: normalizedStudents,
      assessments: normalizedAssessments,
    };
  });

  return parsed;
}

async function writeTeacherDb(data) {
  await writeFile(TEACHER_DB_PATH, JSON.stringify(data, null, 2));
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, region: REGION, model: DEFAULT_MODEL, chatReady: Boolean(KEY) });
});

app.get("/api/teacher/classes", async (_req, res) => {
  try {
    const db = await readTeacherDb();
    return res.json(db.classes || []);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.post("/api/teacher/classes", async (req, res) => {
  try {
    const { name, status = "Active" } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "name is required" });

    const db = await readTeacherDb();
    const classItem = {
      id: `class-${Date.now()}`,
      name: name.trim(),
      status: status.trim() || "Active",
      students: [],
      assessments: [],
    };
    db.classes = [classItem, ...(db.classes || [])];
    await writeTeacherDb(db);
    return res.status(201).json(classItem);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.put("/api/teacher/classes/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, status, students } = req.body;
    const db = await readTeacherDb();
    const classItem = db.classes.find((item) => item.id === classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });

    if (typeof name === "string" && name.trim()) classItem.name = name.trim();
    if (typeof status === "string" && status.trim()) classItem.status = status.trim();
    if (Array.isArray(students)) classItem.students = students.map((s) => String(s).trim()).filter(Boolean);

    await writeTeacherDb(db);
    return res.json(classItem);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.delete("/api/teacher/classes/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    const db = await readTeacherDb();
    const before = db.classes.length;
    db.classes = db.classes.filter((item) => item.id !== classId);
    if (db.classes.length === before) return res.status(404).json({ error: "Class not found" });
    await writeTeacherDb(db);
    return res.status(204).send();
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.post("/api/teacher/classes/:classId/assessments", async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, prompt, keyConcepts = [], kpis = [], files = [] } = req.body;
    if (!title?.trim() || !prompt?.trim()) {
      return res.status(400).json({ error: "title and prompt are required" });
    }

    const db = await readTeacherDb();
    const classItem = db.classes.find((item) => item.id === classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });

    const assessment = {
      id: `${classId}-${Date.now()}`,
      title: title.trim(),
      prompt: prompt.trim(),
      keyConcepts: Array.isArray(keyConcepts)
        ? keyConcepts.map((item) => String(item).trim()).filter(Boolean)
        : Array.isArray(kpis)
          ? kpis.map((item) => String(item).trim()).filter(Boolean)
          : [],
      files: Array.isArray(files) ? files : [],
    };
    classItem.assessments = [assessment, ...(classItem.assessments || [])];
    await writeTeacherDb(db);
    return res.status(201).json(assessment);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.put("/api/teacher/classes/:classId/assessments/:assessmentId", async (req, res) => {
  try {
    const { classId, assessmentId } = req.params;
    const { title, prompt, keyConcepts = [], kpis = [], files = [] } = req.body;
    if (!title?.trim() || !prompt?.trim()) {
      return res.status(400).json({ error: "title and prompt are required" });
    }

    const db = await readTeacherDb();
    const classItem = db.classes.find((item) => item.id === classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });

    const assessment = (classItem.assessments || []).find((item) => item.id === assessmentId);
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });

    assessment.title = title.trim();
    assessment.prompt = prompt.trim();
    assessment.keyConcepts = Array.isArray(keyConcepts)
      ? keyConcepts.map((item) => String(item).trim()).filter(Boolean)
      : Array.isArray(kpis)
        ? kpis.map((item) => String(item).trim()).filter(Boolean)
        : [];
    assessment.files = Array.isArray(files) ? files : [];
    await writeTeacherDb(db);
    return res.json(assessment);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.delete("/api/teacher/classes/:classId/assessments/:assessmentId", async (req, res) => {
  try {
    const { classId, assessmentId } = req.params;
    const db = await readTeacherDb();
    const classItem = db.classes.find((item) => item.id === classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });

    const before = classItem.assessments?.length || 0;
    classItem.assessments = (classItem.assessments || []).filter((item) => item.id !== assessmentId);
    if (classItem.assessments.length === before) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    await writeTeacherDb(db);
    return res.status(204).send();
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.get("/api/student/classes", async (_req, res) => {
  try {
    const db = await readTeacherDb();
    const studentView = (db.classes || []).map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      status: classItem.status,
      students: classItem.students || [],
      assessments: (classItem.assessments || []).map((assessment) => ({
        id: assessment.id,
        title: assessment.title,
        prompt: assessment.prompt,
        keyConcepts: assessment.keyConcepts || [],
      })),
    }));
    return res.json(studentView);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.post("/api/student/classes/:classId/assessments/:assessmentId/submit", async (req, res) => {
  try {
    const { classId, assessmentId } = req.params;
    const { studentName, score, breakdown } = req.body;

    if (!studentName?.trim()) return res.status(400).json({ error: "studentName is required" });
    if (typeof score !== "number") return res.status(400).json({ error: "score must be a number" });

    const db = await readTeacherDb();
    const classItem = db.classes.find((item) => item.id === classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });

    const assessment = (classItem.assessments || []).find((item) => item.id === assessmentId);
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });

    const entry = {
      id: `score-${Date.now()}`,
      studentName: studentName.trim(),
      score: Math.max(0, Math.min(100, Math.round(score))),
      breakdown: Array.isArray(breakdown) ? breakdown : [],
      submittedAt: new Date().toISOString(),
    };

    assessment.scores = [entry, ...(assessment.scores || [])];
    await writeTeacherDb(db);
    return res.status(201).json(entry);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!KEY) {
      return res.status(503).json({
        error: "OCI_GENAI_API_KEY missing. Set it in backend/.env to enable /api/chat.",
      });
    }

    const { messages, model = DEFAULT_MODEL } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages must be a non-empty array" });
    }

    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status).json({
        error: "Oracle GenAI request failed",
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Backend on http://localhost:${PORT}`);
});
