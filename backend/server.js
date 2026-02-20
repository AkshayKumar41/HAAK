import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createTeacherStore } from "./teacherStore.js";
import { LIVE_QUIZ_SYSTEM_PROMPT, buildLiveQuizUserPrompt } from "./prompts/liveQuizPrompts.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));

const PORT = Number(process.env.PORT || 3001);
const REGION = process.env.OCI_REGION || "us-chicago-1";
const BASE = `https://inference.generativeai.${REGION}.oci.oraclecloud.com/20231130/actions/v1`;
const KEY = process.env.OCI_GENAI_API_KEY;
const DEFAULT_MODEL = process.env.OCI_MODEL || "meta.llama-3.3-70b-instruct";
const LIVE_QUIZ_MODEL = process.env.OCI_LIVE_QUIZ_MODEL || DEFAULT_MODEL;
const teacherStore = createTeacherStore();

if (!KEY) {
  console.warn("OCI_GENAI_API_KEY is missing. /api/chat will be disabled until key is set.");
}

async function readTeacherDb() {
  return teacherStore.read();
}

async function writeTeacherDb(data) {
  await teacherStore.write(data);
}

function extractJsonObject(text) {
  if (!text || typeof text !== "string") return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  const raw = text.slice(start, end + 1);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeGeneratedQuiz(parsed, fallbackPrompt, fallbackConcepts) {
  if (!parsed || typeof parsed !== "object") return null;

  const concepts = Array.isArray(fallbackConcepts) ? fallbackConcepts.filter(Boolean) : [];
  const safeConcepts = concepts.length ? concepts : ["Statement Analysis", "Error Detection", "Journal Adjustments"];
  const pages = Array.isArray(parsed.pages) ? parsed.pages : [];
  if (!pages.length) return null;

  const normalizedPages = pages.slice(0, 6).map((page, idx) => {
    const options = Array.isArray(page?.conceptQuestion?.options) ? page.conceptQuestion.options : [];
    const safeOptions =
      options.length >= 4
        ? options.slice(0, 4).map((o) => String(o))
        : [
            "Use evidence from statements and ledger to justify each adjustment",
            "Skip checks and use a shortcut",
            "Prioritize speed over correctness",
            "Ignore conflicting entries",
          ];

    const concept = String(page?.focusConcept || safeConcepts[idx % safeConcepts.length]);
    return {
      id: String(page?.id || `gen-page-${idx + 1}`),
      focusConcept: concept,
      scenarioTitle: String(page?.scenarioTitle || `${concept} Interactive Scenario`),
      caseContext: String(page?.caseContext || "Applied accounting simulation case"),
      taskPrompt: String(page?.taskPrompt || `Complete all tasks focused on ${concept}.`),
      conceptQuestion: {
        prompt: String(page?.conceptQuestion?.prompt || `Select the best action that demonstrates mastery of ${concept}.`),
        options: safeOptions,
        correctIndex:
          typeof page?.conceptQuestion?.correctIndex === "number" &&
          page.conceptQuestion.correctIndex >= 0 &&
          page.conceptQuestion.correctIndex < safeOptions.length
            ? page.conceptQuestion.correctIndex
            : 0,
      },
    };
  });

  const refs = Array.isArray(parsed.caseReferences) ? parsed.caseReferences : [];
  return {
    generatedAt: new Date().toISOString(),
    prompt: fallbackPrompt,
    keyConcepts: safeConcepts,
    realismProfile: String(parsed.realismProfile || "interactive-workbook-sim"),
    caseReferences: refs.slice(0, 5).map((ref, idx) => ({
      tag: String(ref?.tag || `case-${idx + 1}`),
      title: String(ref?.title || "Applied case scenario"),
      sourceHint: String(ref?.sourceHint || "Practical training case"),
    })),
    practiceAppHtml:
      typeof parsed.practiceAppHtml === "string" && parsed.practiceAppHtml.trim().length > 0
        ? parsed.practiceAppHtml
        : null,
    pages: normalizedPages,
  };
}

function buildFallbackPracticeAppHtml({ assessmentTitle, teacherPrompt, keyConcepts }) {
  const safeTitle = JSON.stringify(assessmentTitle || "Practice Simulation");
  const safePrompt = JSON.stringify(teacherPrompt || "");
  const safeConcepts = JSON.stringify((keyConcepts || []).filter(Boolean));

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Practice App</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f3f6fb; color: #172030; }
      .wrap { max-width: 1200px; margin: 0 auto; padding: 16px; }
      .top { display: grid; gap: 10px; background: #fff; border: 1px solid #d7e1ef; border-radius: 12px; padding: 14px; }
      .row { display: flex; gap: 8px; flex-wrap: wrap; }
      button { border: 1px solid #c6d2e6; background: #fff; border-radius: 8px; padding: 8px 10px; cursor: pointer; }
      button.primary { background: #1f6f43; color: #fff; border-color: #1f6f43; }
      .q { margin-top: 10px; border: 1px solid #d7e1ef; background: #fff; border-radius: 10px; padding: 12px; }
      .opts { display: grid; gap: 8px; margin-top: 8px; }
      .status { margin-top: 8px; color: #36557d; }
      .score { margin-top: 10px; font-weight: 700; }
      .files { margin-top: 10px; border: 1px solid #d7e1ef; background: #fff; border-radius: 10px; padding: 12px; }
      .muted { color: #5f6f84; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="top">
        <h2 id="title"></h2>
        <p class="muted">Generated practice runtime (fallback). Live questions are fetched from backend.</p>
        <div class="row">
          <button id="nextQ" class="primary">Generate Live Question</button>
          <button id="markCorrect">Mark Correct</button>
          <button id="markWrong">Mark Wrong</button>
        </div>
        <div class="status" id="guidance">Guidance: start by requesting a live question.</div>
        <div class="score" id="score"></div>
      </div>
      <div class="files">
        <strong>Workbook Files</strong>
        <p class="muted">Open and use: bank_statement_feb.xlsx, general_ledger_feb.xlsx, adjustments_workbook.xlsx</p>
      </div>
      <div class="q">
        <strong>Live Question</strong>
        <div id="prompt" class="muted">No question yet.</div>
        <div id="options" class="opts"></div>
      </div>
    </div>
    <script>
      const title = ${safeTitle};
      const teacherPrompt = ${safePrompt};
      const keyConcepts = ${safeConcepts};
      let asked = 0;
      let correct = 0;
      let current = null;
      let focusConcept = keyConcepts[0] || "Statement Analysis";

      const titleEl = document.getElementById("title");
      const promptEl = document.getElementById("prompt");
      const optionsEl = document.getElementById("options");
      const scoreEl = document.getElementById("score");
      const guidanceEl = document.getElementById("guidance");
      titleEl.textContent = title + " (Practice)";

      function renderScore() {
        const pct = asked ? Math.round((correct / asked) * 100) : 0;
        scoreEl.textContent = "Practice Score: " + pct + "% (" + correct + "/" + asked + ")";
      }

      function renderQuestion(q) {
        current = q;
        promptEl.textContent = q.prompt || "No prompt";
        optionsEl.innerHTML = "";
        (q.options || []).forEach((opt, idx) => {
          const btn = document.createElement("button");
          btn.textContent = (idx + 1) + ". " + opt;
          btn.onclick = () => {
            const isCorrect = idx === q.correctIndex;
            asked += 1;
            if (isCorrect) correct += 1;
            guidanceEl.textContent = isCorrect
              ? "Guidance: good answer. Next concept will increase in difficulty."
              : "Guidance: review evidence and try again on this concept.";
            renderScore();
          };
          optionsEl.appendChild(btn);
        });
      }

      async function fetchLiveQuestion() {
        const body = {
          assessmentTitle: title,
          teacherPrompt,
          keyConcepts,
          focusConcept,
          userState: { asked, correct }
        };
        const res = await fetch("/api/student/live-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        renderQuestion(data);
      }

      document.getElementById("nextQ").onclick = async () => {
        focusConcept = keyConcepts[asked % Math.max(1, keyConcepts.length)] || "Statement Analysis";
        await fetchLiveQuestion();
      };
      document.getElementById("markCorrect").onclick = () => { asked += 1; correct += 1; renderScore(); };
      document.getElementById("markWrong").onclick = () => { asked += 1; renderScore(); };
      renderScore();
    </script>
  </body>
</html>`;
}

async function callOciChat({ messages, model }) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(`OCI chat failed (${r.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

function buildGeneratedQuizBlueprint({ prompt, keyConcepts }) {
  const concepts = (keyConcepts || []).filter(Boolean);
  const fallbackConcepts = concepts.length ? concepts : ["Statement Analysis", "Error Detection", "Journal Adjustments"];
  const p = (prompt || "").toLowerCase();

  const caseBank = [
    {
      tag: "revenue-reconciliation",
      title: "Revenue Reconciliation for Mid-Market SaaS",
      sourceHint: "Public accounting training packs and audit simulation worksheets",
      trigger: ["revenue", "reconciliation", "ledger", "bank"],
    },
    {
      tag: "cashflow-anomalies",
      title: "Cashflow Anomaly Investigation in Retail Ops",
      sourceHint: "University accounting case studies and CPA prep scenarios",
      trigger: ["cash", "bank", "anomaly", "retail"],
    },
    {
      tag: "duplicate-payments",
      title: "Duplicate Vendor Payment Recovery",
      sourceHint: "Accounts payable process-improvement case libraries",
      trigger: ["duplicate", "vendor", "payment"],
    },
  ];

  const references = caseBank
    .filter((item) => item.trigger.some((kw) => p.includes(kw)))
    .slice(0, 2);

  const selectedReferences = references.length ? references : [caseBank[0]];

  const pages = fallbackConcepts.map((concept, idx) => ({
    id: `gen-page-${idx + 1}`,
    focusConcept: concept,
    scenarioTitle: `${concept} Interactive Scenario`,
    caseContext: selectedReferences[idx % selectedReferences.length].title,
    taskPrompt: `Interact with the workbook files and complete all tasks focused on ${concept}.`,
    conceptQuestion: {
      prompt: `Select the best action that demonstrates mastery of ${concept}.`,
      options: [
        "Use evidence from statements and ledger to justify each adjustment",
        "Skip checks and use a shortcut",
        "Prioritize speed over correctness",
        "Ignore conflicting entries",
      ],
      correctIndex: 0,
    },
  }));

  const title = "Generated Interactive Simulation";
  return {
    generatedAt: new Date().toISOString(),
    prompt,
    keyConcepts: fallbackConcepts,
    realismProfile: "interactive-workbook-sim",
    caseReferences: selectedReferences.map((item) => ({
      tag: item.tag,
      title: item.title,
      sourceHint: item.sourceHint,
    })),
    practiceAppHtml: buildFallbackPracticeAppHtml({
      assessmentTitle: title,
      teacherPrompt: prompt,
      keyConcepts: fallbackConcepts,
    }),
    pages,
  };
}

function normalizeLiveQuestion(parsed, focusConcept) {
  if (!parsed || typeof parsed !== "object") return null;
  const options = Array.isArray(parsed.options) ? parsed.options : [];
  if (options.length < 4) return null;

  const safeOptions = options.slice(0, 4).map((item) => String(item));
  const rawIndex = Number(parsed.correctIndex);
  return {
    prompt:
      typeof parsed.prompt === "string" && parsed.prompt.trim()
        ? parsed.prompt.trim()
        : `Select the strongest reconciliation action for ${focusConcept || "this concept"}.`,
    options: safeOptions,
    correctIndex: Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < safeOptions.length ? rawIndex : 0,
    guidance:
      typeof parsed.guidance === "string" && parsed.guidance.trim()
        ? parsed.guidance.trim()
        : "Use evidence from statements and ledger, then justify each adjustment.",
  };
}

function buildFallbackLiveQuestion({ focusConcept }) {
  const concept = focusConcept || "Statement Analysis";
  return {
    prompt: `Which action best demonstrates mastery of ${concept}?`,
    options: [
      "Verify discrepancies with source statements before adjusting entries",
      "Skip validation and estimate missing values",
      "Delete mismatched entries to force balance",
      "Apply one blanket adjustment to all variances",
    ],
    correctIndex: 0,
    guidance: `Review ${concept} using source evidence before posting adjustments.`,
    fallback: true,
  };
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    region: REGION,
    model: DEFAULT_MODEL,
    chatReady: Boolean(KEY),
    storage: teacherStore.type,
  });
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
      generatedQuiz: null,
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
    const { title, prompt, keyConcepts = [], kpis = [], files = [], generatedQuiz } = req.body;
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
    if (generatedQuiz !== undefined) {
      assessment.generatedQuiz = generatedQuiz || null;
    }
    await writeTeacherDb(db);
    return res.json(assessment);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.post("/api/teacher/classes/:classId/assessments/:assessmentId/generate-live-quiz", async (req, res) => {
  try {
    const { classId, assessmentId } = req.params;
    const { prompt = "", keyConcepts = [] } = req.body;
    if (!KEY) {
      return res.status(503).json({ error: "OCI_GENAI_API_KEY missing. Cannot generate live quiz." });
    }

    const db = await readTeacherDb();
    const classItem = db.classes.find((item) => item.id === classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });

    const assessment = (classItem.assessments || []).find((item) => item.id === assessmentId);
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });

    const resolvedPrompt = prompt.trim() || assessment.prompt;
    const resolvedConcepts =
      Array.isArray(keyConcepts) && keyConcepts.length ? keyConcepts : assessment.keyConcepts;

    const messages = [
      { role: "system", content: LIVE_QUIZ_SYSTEM_PROMPT.trim() },
      {
        role: "user",
        content: buildLiveQuizUserPrompt({
          title: assessment.title,
          teacherPrompt: resolvedPrompt,
          keyConcepts: resolvedConcepts,
          files: assessment.files || [],
        }),
      },
    ];

    let generated = null;
    try {
      const oci = await callOciChat({ messages, model: LIVE_QUIZ_MODEL });
      const text =
        oci?.choices?.[0]?.message?.content ||
        oci?.choices?.[0]?.text ||
        "";
      const parsed = extractJsonObject(text);
      generated = normalizeGeneratedQuiz(parsed, resolvedPrompt, resolvedConcepts);
    } catch (ociError) {
      console.error("Live quiz generation via OCI failed:", ociError);
    }

    if (!generated) {
      generated = buildGeneratedQuizBlueprint({
        prompt: resolvedPrompt,
        keyConcepts: resolvedConcepts,
      });
      generated.fallback = true;
      generated.fallbackReason = "Used local fallback because OCI response was unavailable or malformed.";
    }
    if (!generated.practiceAppHtml) {
      generated.practiceAppHtml = buildFallbackPracticeAppHtml({
        assessmentTitle: assessment.title,
        teacherPrompt: resolvedPrompt,
        keyConcepts: generated.keyConcepts || resolvedConcepts || [],
      });
    }

    assessment.generatedQuiz = generated;
    await writeTeacherDb(db);
    return res.json(generated);
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
        generatedQuiz: assessment.generatedQuiz || null,
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

app.post("/api/student/live-question", async (req, res) => {
  try {
    const {
      assessmentTitle = "Practice Assessment",
      teacherPrompt = "",
      keyConcepts = [],
      focusConcept = "",
      userState = {},
    } = req.body || {};

    const safeConcepts = Array.isArray(keyConcepts)
      ? keyConcepts.map((item) => String(item).trim()).filter(Boolean)
      : [];
    const resolvedConcept = String(focusConcept || safeConcepts[0] || "Statement Analysis");
    const state = {
      asked: Number(userState?.asked || 0),
      correct: Number(userState?.correct || 0),
      recentMistakes: Array.isArray(userState?.recentMistakes) ? userState.recentMistakes.slice(0, 5) : [],
    };

    if (!KEY) {
      return res.json(buildFallbackLiveQuestion({ focusConcept: resolvedConcept }));
    }

    const liveQuestionSystemPrompt = `
You generate one adaptive assessment question as strict JSON only.
Return exactly this shape:
{
  "prompt": "string",
  "options": ["string", "string", "string", "string"],
  "correctIndex": 0,
  "guidance": "string"
}
Constraints:
- Make the question scenario-based and realistic.
- Keep options plausible with one best answer.
- Use the focus concept and adapt to user performance state.
`;

    const messages = [
      { role: "system", content: liveQuestionSystemPrompt.trim() },
      {
        role: "user",
        content: `
Assessment title: ${assessmentTitle}
Teacher prompt: ${teacherPrompt || "N/A"}
Key concepts: ${safeConcepts.length ? safeConcepts.join(", ") : "Statement Analysis, Error Detection, Journal Adjustments"}
Focus concept: ${resolvedConcept}
User state (for adaptation): ${JSON.stringify(state)}
        `.trim(),
      },
    ];

    try {
      const oci = await callOciChat({ messages, model: LIVE_QUIZ_MODEL });
      const text =
        oci?.choices?.[0]?.message?.content ||
        oci?.choices?.[0]?.text ||
        "";
      const parsed = extractJsonObject(text);
      const question = normalizeLiveQuestion(parsed, resolvedConcept);
      if (!question) {
        return res.json(buildFallbackLiveQuestion({ focusConcept: resolvedConcept }));
      }
      return res.json(question);
    } catch (ociError) {
      console.error("Live question generation via OCI failed:", ociError);
      return res.json(buildFallbackLiveQuestion({ focusConcept: resolvedConcept }));
    }
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

await teacherStore.init();
console.log(`Teacher storage: ${teacherStore.type}`);

app.listen(PORT, () => {
  console.log(`Backend on http://localhost:${PORT}`);
});
