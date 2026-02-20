export const LIVE_QUIZ_SYSTEM_PROMPT = `
You design realistic, interactive simulation-based assessments for students.
Return only strict JSON (no markdown, no backticks, no prose outside JSON).

Constraints:
- Produce between 3 and 6 pages.
- Each page must be an interactive workbook simulation page.
- Every page must target one key concept.
- Scenarios must feel realistic and job-like (bank statement, ledger, adjustments, etc.).
- Include case references with practical "sourceHint" phrases.
- Keep options in concept questions plausible and educational.
- Also produce a full practice web app in HTML/JS that renders the practice test UX.
- The practice app must call POST /api/student/live-question to fetch live adaptive questions.
- No external libraries or CDNs; plain HTML/CSS/JS only.
- The generated app must look polished and readable (not a plain demo).

Practice app UX requirements:
- Desktop-like simulation layout with:
  - file explorer sidebar
  - draggable windows
  - workbook-style tabs
  - task panel with progress and guidance
- Use CSS variables for color, spacing, radius, and shadows.
- Body text min 14px; clear spacing and readable line lengths.
- Clean class names and modular JS functions (avoid one giant script).
- Clear hierarchy: header, workspace, tasks, live-question panel.
- Add hover/focus states and polished interaction feedback.
- Avoid giant text dumps in one paragraph.
- Present data in compact tables/cards where relevant.

Return JSON shape:
{
  "realismProfile": "interactive-workbook-sim",
  "caseReferences": [{ "tag": "string", "title": "string", "sourceHint": "string" }],
  "pages": [{
    "id": "gen-page-1",
    "focusConcept": "string",
    "scenarioTitle": "string",
    "caseContext": "string",
    "taskPrompt": "string",
    "conceptQuestion": {
      "prompt": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0
    }
  }],
  "practiceAppHtml": "<!doctype html> ... full app html ..."
}
`;

export function buildLiveQuizUserPrompt({ title, teacherPrompt, keyConcepts, files }) {
  return `
Assessment title: ${title || "Untitled assessment"}

Teacher intent:
${teacherPrompt || "No extra prompt provided."}

Key concepts to cover:
${(keyConcepts || []).length ? keyConcepts.map((c) => `- ${c}`).join("\n") : "- Statement Analysis\n- Error Detection\n- Journal Adjustments"}

Attached file names:
${(files || []).length ? files.map((f) => `- ${f?.name || "file"}`).join("\n") : "- None"}

Generate a realistic, adaptive-friendly simulation blueprint for this assessment.
Also generate the full practice app HTML.

Requirements for practice app:
- Must include file-explorer navigation, workbook tabs, and draggable file windows.
- Must include visible tasks, progress, and adaptive guidance.
- Must call POST /api/student/live-question with JSON body at least:
  { assessmentTitle, teacherPrompt, keyConcepts, focusConcept, userState }
- Must display returned question/options interactively.
- Must compute and display a practice score locally (do not submit to teacher).
- Must feel like a professional simulator, not a plain form UI.
- Keep text concise and readable; avoid tiny fonts and cramped layout.

Visual direction:
- modern enterprise training product
- neutral + blue-gray base with one accent color
- distinct panels with spacing and subtle depth
- clean typography and button states

Output discipline:
- Return valid JSON only.
- Ensure practiceAppHtml is complete runnable HTML.
- Ensure JSON string escaping is valid.
`;
}
