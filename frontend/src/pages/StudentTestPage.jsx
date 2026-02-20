import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const DEFAULT_CONCEPTS = [
  "Statement Analysis",
  "Error Detection",
  "Journal Adjustments",
  "Revenue Recognition",
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function getStudentName() {
  const saved = localStorage.getItem("IntuMotion_profile_name") || "";
  if (saved) return saved;

  const identity = localStorage.getItem("IntuMotion_identity") || "";
  if (identity.includes("@")) return identity.split("@")[0] || "Student";
  return identity || "Student";
}

function fileLabel(type) {
  if (type === "bank") return "bank_statement_feb.xlsx";
  if (type === "ledger") return "general_ledger_feb.xlsx";
  return "adjustments_workbook.xlsx";
}

function formulaHint(type) {
  if (type === "bank") return "=SUM(D2:D6)";
  if (type === "ledger") return "=SUM(E2:E7)";
  return "=IF(C2=TRUE,\"Selected\",\"Not Selected\")";
}

function generateConceptQuestion(concept) {
  const map = {
    "Statement Analysis": {
      prompt: "Which source should be treated as external truth during reconciliation?",
      options: ["Bank statement", "Internal memo", "Draft worksheet", "Email summary"],
      correctIndex: 0,
    },
    "Error Detection": {
      prompt: "What is the strongest duplicate-payment signal in a ledger?",
      options: ["Same memo + amount + date", "Different amount", "Older posting", "Any expense entry"],
      correctIndex: 0,
    },
    "Journal Adjustments": {
      prompt: "A valid reconciliation adjustment should primarily do what?",
      options: ["Resolve a verified timing/difference", "Increase revenue target", "Match budget", "Format data"],
      correctIndex: 0,
    },
    "Revenue Recognition": {
      prompt: "When should revenue generally be recognized?",
      options: ["When performance obligations are satisfied", "At invoice creation", "At contract signing", "At payment receipt only"],
      correctIndex: 0,
    },
  };

  return map[concept] || {
    prompt: `Which action best demonstrates mastery of ${concept}?`,
    options: ["Use evidence and reconcile", "Skip verification", "Guess", "Ignore mismatches"],
    correctIndex: 0,
  };
}

function buildScenario({ focusConcept, pageIndex, openingCash, remediation, template }) {
  const bankFee = randomBetween(35, 60);
  const duplicateVendorPayment = randomBetween(1400, 2400);
  const openingOffset = randomBetween(50, 250);
  const pageTag = remediation ? "Remediation" : "Core";

  const bankEntries = [
    { id: "b1", date: "2026-02-10", description: `Client Deposit ${pageTag} - Orion LLC`, amount: 12250 },
    { id: "b2", date: "2026-02-12", description: "Payroll Batch", amount: -5200 },
    { id: "b3", date: "2026-02-13", description: "Office Rent", amount: -1800 },
    { id: "b4", date: "2026-02-14", description: "Bank Service Fee", amount: -bankFee },
    { id: "b5", date: "2026-02-15", description: "Client Deposit - Moss Retail", amount: 3750 + openingOffset },
  ];

  const ledgerEntries = [
    { id: "l1", date: "2026-02-10", account: "Accounts Receivable", memo: "Orion LLC payment", amount: 12250 },
    { id: "l2", date: "2026-02-12", account: "Payroll Expense", memo: "Payroll run", amount: -5200 },
    { id: "l3", date: "2026-02-13", account: "Rent Expense", memo: "Office rent", amount: -1800 },
    {
      id: "l4",
      date: "2026-02-14",
      account: "Vendor Payment",
      memo: "Duplicate check #2941",
      amount: -duplicateVendorPayment,
    },
    {
      id: "l5",
      date: "2026-02-14",
      account: "Vendor Payment",
      memo: "Duplicate check #2941",
      amount: -duplicateVendorPayment,
    },
    {
      id: "l6",
      date: "2026-02-15",
      account: focusConcept === "Revenue Recognition" ? "Deferred Revenue" : "Accounts Receivable",
      memo: "Moss Retail posting",
      amount: 3750 + openingOffset,
    },
  ];

  const adjustmentOptions = [
    { id: "adj-fee", label: `Record bank service fee expense ${currency(bankFee)} (Dr Bank Fees, Cr Cash)` },
    { id: "adj-reverse-dup", label: `Reverse duplicate vendor payment ${currency(duplicateVendorPayment)} (Dr Cash, Cr Expense)` },
    { id: "adj-rent-accrual", label: "Accrue next month's rent expense" },
    { id: "adj-deferred-revenue", label: "Move deposit to deferred revenue" },
  ];

  const question = template?.conceptQuestion || generateConceptQuestion(focusConcept);

  return {
    id: `${remediation ? "remed" : "core"}-${pageIndex}-${Date.now()}`,
    title:
      template?.scenarioTitle || `${remediation ? "Remediation" : "Problem"} ${pageIndex + 1}: ${focusConcept}`,
    focusConcept,
    remediation,
    caseContext: template?.caseContext || null,
    taskPrompt: template?.taskPrompt || null,
    openingCash,
    expectedNetDelta: duplicateVendorPayment - bankFee,
    bankEntries,
    ledgerEntries,
    adjustmentOptions,
    required: {
      bankFlags: ["b4"],
      ledgerFlags: ["l5"],
      adjustments: ["adj-fee", "adj-reverse-dup"],
    },
    conceptQuestion: question,
  };
}

function evaluatePage({ page, bankFlags, ledgerFlags, selectedAdjustments, openedTypes, conceptAnswer }) {
  const req = page.required;
  const filesTaskDone = ["bank", "ledger", "adjustments"].every((file) => openedTypes.includes(file));
  const bankTaskDone =
    bankFlags.length === req.bankFlags.length && req.bankFlags.every((id) => bankFlags.includes(id));
  const ledgerTaskDone =
    ledgerFlags.length === req.ledgerFlags.length && req.ledgerFlags.every((id) => ledgerFlags.includes(id));
  const adjustmentTaskDone =
    selectedAdjustments.length === req.adjustments.length &&
    req.adjustments.every((id) => selectedAdjustments.includes(id));
  const conceptTaskDone = conceptAnswer === page.conceptQuestion.correctIndex;

  const tasks = [
    {
      id: `${page.id}-t0`,
      concept: "Navigation",
      label: "Open bank statement, ledger, and adjustment workbook from file explorer",
      done: filesTaskDone,
    },
    {
      id: `${page.id}-t1`,
      concept: "Statement Analysis",
      label: "Identify the unrecorded bank fee in the statement",
      done: bankTaskDone,
    },
    {
      id: `${page.id}-t2`,
      concept: "Error Detection",
      label: "Find the duplicate vendor payment in the ledger",
      done: ledgerTaskDone,
    },
    {
      id: `${page.id}-t3`,
      concept: "Journal Adjustments",
      label: "Select only the correct reconciliation adjustments",
      done: adjustmentTaskDone,
    },
    {
      id: `${page.id}-t4`,
      concept: page.focusConcept,
      label: `Answer the concept check for ${page.focusConcept}`,
      done: conceptTaskDone,
    },
  ];

  return {
    tasks,
    allDone: tasks.every((task) => task.done),
  };
}

function guidanceForTask(taskConcept, attempt) {
  if (taskConcept === "Navigation") {
    return "AI Coach: Open all three files first. The reconciliation can only be solved with full context.";
  }
  if (taskConcept === "Statement Analysis") {
    return "AI Coach: Focus on bank-only cash decreases not mirrored in the ledger postings.";
  }
  if (taskConcept === "Error Detection") {
    return "AI Coach: Sort by memo and amount, then look for same-day duplicates.";
  }
  if (taskConcept === "Journal Adjustments") {
    return "AI Coach: Keep adjustments strictly tied to observed differences; ignore unrelated entries.";
  }
  return `AI Coach: Revisit ${taskConcept}. Attempt ${attempt}.`;
}

function deriveWeakConcepts(concepts, stats) {
  return concepts
    .map((concept) => {
      const stat = stats[concept] || { correct: 0, total: 0, struggles: 0 };
      const ratio = stat.total ? stat.correct / stat.total : 0;
      return { concept, ratio, struggles: stat.struggles || 0 };
    })
    .filter((item) => item.struggles >= 2 || item.ratio < 0.6)
    .sort((a, b) => a.ratio - b.ratio || b.struggles - a.struggles)
    .map((item) => item.concept);
}

export default function StudentTestPage() {
  const { classId, assessmentId, mode } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyConcepts, setKeyConcepts] = useState(DEFAULT_CONCEPTS);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [bankFlags, setBankFlags] = useState([]);
  const [ledgerFlags, setLedgerFlags] = useState([]);
  const [selectedAdjustments, setSelectedAdjustments] = useState([]);
  const [conceptAnswer, setConceptAnswer] = useState(null);

  const [openedTypes, setOpenedTypes] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({ finance: true, statements: true, entries: true });
  const [windows, setWindows] = useState([]);
  const [zCounter, setZCounter] = useState(20);
  const [dragState, setDragState] = useState(null);
  const [windowTabs, setWindowTabs] = useState({ bank: "sheet", ledger: "sheet", adjustments: "sheet" });
  const desktopRef = useRef(null);

  const [attemptCount, setAttemptCount] = useState(0);
  const [taskSnapshot, setTaskSnapshot] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState("");
  const [conceptStats, setConceptStats] = useState({});
  const [coachMessage, setCoachMessage] = useState("AI Coach: Open your files and begin reconciliation.");
  const [pageResults, setPageResults] = useState([]);
  const [carryoverCash, setCarryoverCash] = useState(50000);

  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isPractice = mode === "practice";
  const generatedPracticeHtml =
    isPractice && generatedQuiz?.practiceAppHtml && generatedQuiz.practiceAppHtml.trim().length
      ? generatedQuiz.practiceAppHtml
      : "";
  const currentPage = pages[currentPageIndex] || null;

  const evaluation = useMemo(() => {
    if (!currentPage) return { tasks: [], allDone: false };
    return evaluatePage({
      page: currentPage,
      bankFlags,
      ledgerFlags,
      selectedAdjustments,
      openedTypes,
      conceptAnswer,
    });
  }, [currentPage, bankFlags, ledgerFlags, selectedAdjustments, openedTypes, conceptAnswer]);

  const progressPercent = useMemo(() => {
    const total = evaluation.tasks.length || 1;
    const done = evaluation.tasks.filter((task) => task.done).length;
    return Math.round((done / total) * 100);
  }, [evaluation.tasks]);

  const overallProgress = useMemo(() => {
    if (!pages.length) return 0;
    const completed = pageResults.length;
    return Math.round((completed / pages.length) * 100);
  }, [pages.length, pageResults.length]);

  const breakdown = useMemo(() => {
    return Object.entries(conceptStats).map(([concept, stat]) => ({
      concept,
      correct: stat.correct,
      total: stat.total,
      percent: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0,
    }));
  }, [conceptStats]);

  const score = useMemo(() => {
    if (!finished) return 0;

    const conceptRatios = Object.values(conceptStats).map((stat) => (stat.total ? stat.correct / stat.total : 0));
    const avgConcept = conceptRatios.length
      ? conceptRatios.reduce((acc, value) => acc + value, 0) / conceptRatios.length
      : 0;

    const completion = pages.length ? pageResults.length / pages.length : 0;
    const avgAttempts = pageResults.length
      ? pageResults.reduce((acc, item) => acc + item.attempts, 0) / pageResults.length
      : 1;

    const completionWeight = completion * 60;
    const conceptWeight = avgConcept * 30;
    const efficiencyWeight = Math.max(0, 10 - Math.max(0, avgAttempts - 1) * 2);

    return Math.round(Math.max(0, Math.min(100, completionWeight + conceptWeight + efficiencyWeight)));
  }, [finished, conceptStats, pages.length, pageResults]);

  useEffect(() => {
    async function loadAssessment() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/student/classes");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load assessment");

        const classItem = (data || []).find((item) => item.id === classId);
        const found = classItem?.assessments?.find((item) => item.id === assessmentId);
        if (!classItem || !found) throw new Error("Assessment not found");

        setAssessment({ ...found, className: classItem.name });
        setGeneratedQuiz(found.generatedQuiz || null);

        const concepts = (found.keyConcepts || []).filter(Boolean);
        const generatedConcepts = (found.generatedQuiz?.keyConcepts || []).filter(Boolean);
        const pool = isPractice
          ? concepts.length
            ? concepts
            : DEFAULT_CONCEPTS
          : generatedConcepts.length
            ? generatedConcepts
            : concepts.length
              ? concepts
              : DEFAULT_CONCEPTS;
        setKeyConcepts(pool);

        let rollingCash = 50000;
        const initialPages = !isPractice && Array.isArray(found.generatedQuiz?.pages) && found.generatedQuiz.pages.length
          ? found.generatedQuiz.pages.map((pageTemplate, idx) => {
              const concept = pageTemplate.focusConcept || pool[idx] || DEFAULT_CONCEPTS[0];
              const page = buildScenario({
                focusConcept: concept,
                pageIndex: idx,
                openingCash: rollingCash,
                remediation: false,
                template: pageTemplate,
              });
              rollingCash += page.expectedNetDelta;
              return page;
            })
          : pool.map((concept, idx) => {
              const page = buildScenario({
                focusConcept: concept,
                pageIndex: idx,
                openingCash: rollingCash,
                remediation: false,
              });
              rollingCash += page.expectedNetDelta;
              return page;
            });

        setPages(initialPages);
        setCurrentPageIndex(0);
        setExpandedTaskId(`${initialPages[0]?.id}-t0`);
        setCarryoverCash(rollingCash);
        setCoachMessage("AI Coach: Start with the first problem and open the required files.");
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [classId, assessmentId, isPractice]);

  useEffect(() => {
    if (!currentPage) return;
    setBankFlags([]);
    setLedgerFlags([]);
    setSelectedAdjustments([]);
    setOpenedTypes([]);
    setWindows([]);
    setAttemptCount(0);
    setTaskSnapshot([]);
    setConceptAnswer(null);
    setExpandedTaskId(`${currentPage.id}-t0`);
  }, [currentPageIndex, currentPage?.id]);

  useEffect(() => {
    const nextOpen = evaluation.tasks.find((task) => !task.done);
    setExpandedTaskId(nextOpen ? nextOpen.id : evaluation.tasks[0]?.id || "");
  }, [evaluation.tasks]);

  useEffect(() => {
    if (!dragState) return undefined;

    function onMove(e) {
      const canvas = desktopRef.current;
      if (!canvas) return;
      const canvasRect = canvas.getBoundingClientRect();

      setWindows((prev) =>
        prev.map((w) =>
          w.id === dragState.id
            ? {
                ...w,
                x: Math.min(
                  Math.max(0, e.clientX - canvasRect.left - dragState.offsetX),
                  Math.max(0, canvasRect.width - dragState.winWidth - 6)
                ),
                y: Math.min(
                  Math.max(0, e.clientY - canvasRect.top - dragState.offsetY),
                  Math.max(0, canvasRect.height - dragState.winHeight - 6)
                ),
              }
            : w
        )
      );
    }

    function onUp() {
      setDragState(null);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragState]);

  function toggleFlag(list, setList, id) {
    setList((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleAdjustment(id) {
    setSelectedAdjustments((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleFolder(id) {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openWindow(type) {
    setOpenedTypes((prev) => (prev.includes(type) ? prev : [...prev, type]));

    setWindows((prev) => {
      const existing = prev.find((w) => w.type === type);
      if (existing) {
        const nextZ = zCounter + 1;
        setZCounter(nextZ);
        return prev.map((w) => (w.id === existing.id ? { ...w, z: nextZ } : w));
      }

      const nextZ = zCounter + 1;
      setZCounter(nextZ);
      return [
        ...prev,
        {
          id: `w-${type}`,
          type,
          x: 280 + prev.length * 26,
          y: 120 + prev.length * 18,
          z: nextZ,
        },
      ];
    });
  }

  function bringFront(id) {
    const nextZ = zCounter + 1;
    setZCounter(nextZ);
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, z: nextZ } : w)));
  }

  function startDrag(e, id) {
    const windowEl = e.currentTarget.closest(".desk-window");
    const rect = windowEl?.getBoundingClientRect();
    if (!rect) return;
    setDragState({
      id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      winWidth: rect.width,
      winHeight: rect.height,
    });
    bringFront(id);
  }

  function closeWindow(id) {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }

  function computeFinalScore(nextStats, nextResults, totalPages) {
    const conceptRatios = Object.values(nextStats).map((stat) => (stat.total ? stat.correct / stat.total : 0));
    const avgConcept = conceptRatios.length
      ? conceptRatios.reduce((acc, value) => acc + value, 0) / conceptRatios.length
      : 0;

    const completion = totalPages ? nextResults.length / totalPages : 0;
    const avgAttempts = nextResults.length
      ? nextResults.reduce((acc, item) => acc + item.attempts, 0) / nextResults.length
      : 1;

    const completionWeight = completion * 60;
    const conceptWeight = avgConcept * 30;
    const efficiencyWeight = Math.max(0, 10 - Math.max(0, avgAttempts - 1) * 2);

    return Math.round(Math.max(0, Math.min(100, completionWeight + conceptWeight + efficiencyWeight)));
  }

  async function completeSimulation(nextStats, nextResults, finalScore) {
    setFinished(true);

    if (!isPractice) {
      setSubmitting(true);
      try {
        await fetch(`/api/student/classes/${classId}/assessments/${assessmentId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentName: getStudentName(),
            score: finalScore,
            breakdown: Object.entries(nextStats).map(([concept, stat]) => ({
              concept,
              correct: stat.correct,
              total: stat.total,
            })),
          }),
        });
      } catch {
        setError("Could not submit score to teacher portal.");
      } finally {
        setSubmitting(false);
      }
    }
  }

  async function validateAttempt() {
    if (finished || !currentPage) return;

    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);

    const result = evaluatePage({
      page: currentPage,
      bankFlags,
      ledgerFlags,
      selectedAdjustments,
      openedTypes,
      conceptAnswer,
    });
    setTaskSnapshot(result.tasks);

    const nextStats = { ...conceptStats };
    result.tasks.forEach((task) => {
      const prev = nextStats[task.concept] || { correct: 0, total: 0, struggles: 0 };
      nextStats[task.concept] = {
        correct: prev.correct + (task.done ? 1 : 0),
        total: prev.total + 1,
        struggles: prev.struggles + (task.done ? 0 : 1),
      };
    });
    setConceptStats(nextStats);

    if (!result.allDone) {
      const weakest = result.tasks
        .filter((task) => !task.done)
        .map((task) => {
          const stat = nextStats[task.concept] || { correct: 0, total: 0 };
          const ratio = stat.total ? stat.correct / stat.total : 0;
          return { concept: task.concept, ratio };
        })
        .sort((a, b) => a.ratio - b.ratio)[0];

      setCoachMessage(guidanceForTask(weakest?.concept, nextAttempt));
      return;
    }

    setCoachMessage("AI Coach: Nice work. This problem is complete.");
    const currentResult = { pageId: currentPage.id, concept: currentPage.focusConcept, attempts: nextAttempt };
    const nextResults = [...pageResults, currentResult];
    setPageResults(nextResults);
    setCarryoverCash((prev) => prev + currentPage.expectedNetDelta);

    const nextPageIndex = currentPageIndex + 1;
    if (nextPageIndex < pages.length) {
      setCurrentPageIndex(nextPageIndex);
      return;
    }

    if (isPractice) {
      const weakConcepts = deriveWeakConcepts(keyConcepts, nextStats);
      const existingRemedConcepts = pages.filter((p) => p.remediation).map((p) => p.focusConcept);
      const todoRemed = weakConcepts.filter((c) => !existingRemedConcepts.includes(c)).slice(0, 2);

      if (todoRemed.length > 0) {
        const startIndex = pages.length;
        const newPages = todoRemed.map((concept, idx) =>
          buildScenario({
            focusConcept: concept,
            pageIndex: startIndex + idx,
            openingCash: carryoverCash + idx * 180,
            remediation: true,
          })
        );

        setPages((prev) => [...prev, ...newPages]);
        setCurrentPageIndex(nextPageIndex);
        setCoachMessage("AI Coach: Additional adaptive problems generated based on your needs.");
        return;
      }
    }

    const finalScore = computeFinalScore(nextStats, nextResults, pages.length);
    await completeSimulation(nextStats, nextResults, finalScore);
  }

  const fileTree = [
    {
      id: "finance",
      label: "Finance Files",
      children: [
        {
          id: "statements",
          label: "Statements",
          children: [{ id: "file-bank", label: fileLabel("bank"), type: "bank" }],
        },
        {
          id: "entries",
          label: "Journal Entries",
          children: [
            { id: "file-ledger", label: fileLabel("ledger"), type: "ledger" },
            { id: "file-adjustments", label: fileLabel("adjustments"), type: "adjustments" },
          ],
        },
      ],
    },
  ];

  return (
    <div className="shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-grid" />

      <header className="site-header reveal">
        <Link className="brand" to="/student">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">IntuMotion</span>
        </Link>
        <nav>
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/student")}>
            Back to Portal
          </button>
        </nav>
      </header>

      <main className="sim-main-full">
        <section className="panel reveal">
          <h2>{isPractice ? "Practice Simulation" : "Generated Simulation Test"}</h2>
          <p className="portal-subtitle">{assessment?.className || "Class"} • {assessment?.title || "Assessment"}</p>

          <div className="sim-progress-wrap">
            <div className="sim-progress-meta">
              <strong>Problem Progress</strong>
              <span>{progressPercent}%</span>
            </div>
            <div className="sim-progress-track">
              <div className="sim-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="sim-progress-meta overall">
              <span>Overall</span>
              <span>{overallProgress}% ({pageResults.length}/{pages.length} pages)</span>
            </div>
          </div>

          {loading && <p className="portal-subtitle">Generating adaptive simulation pages...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !finished && isPractice && generatedPracticeHtml && (
            <div className="practice-app-shell">
              <div className="practice-app-head">
                <strong>Generated Practice App</strong>
                <span>Runtime generated from teacher prompt + key concepts</span>
              </div>
              <iframe
                className="practice-app-frame"
                title="Generated Practice Test"
                srcDoc={generatedPracticeHtml}
                sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
              />
            </div>
          )}

          {!loading && !finished && isPractice && !generatedPracticeHtml && (
            <div className="auth-form">
              <h3>Practice App Not Generated Yet</h3>
              <p className="portal-subtitle">
                Ask the teacher to click "Generate Realistic Test" in the assessment editor first.
              </p>
            </div>
          )}

          {!loading && !finished && currentPage && (!isPractice || !generatedPracticeHtml) && (
            <div className="sim-layout">
              <aside className="sim-sidebar">
                <h3>{currentPage.title}</h3>
                <p className="portal-subtitle">Focus: {currentPage.focusConcept}</p>
                {currentPage.caseContext && <p className="portal-subtitle">Case: {currentPage.caseContext}</p>}
                <p className="portal-subtitle">Opening cash (from previous pages): {currency(currentPage.openingCash)}</p>
                {currentPage.taskPrompt && <p className="portal-subtitle">{currentPage.taskPrompt}</p>}

                <div className="task-list">
                  {evaluation.tasks.map((task) => (
                    <div key={task.id} className={`task-item ${task.done ? "done" : ""}`}>
                      <button
                        type="button"
                        className="task-toggle"
                        onClick={() => setExpandedTaskId((prev) => (prev === task.id ? "" : task.id))}
                      >
                        <strong>{task.done ? "Done" : "Open"}</strong>
                        <span>{task.done ? "▸" : expandedTaskId === task.id ? "▾" : "▸"}</span>
                      </button>
                      {expandedTaskId === task.id && <p>{task.label}</p>}
                    </div>
                  ))}
                </div>

                <div className="coach-box">
                  <strong>Adaptive AI Guidance</strong>
                  <p>{coachMessage}</p>
                </div>

                <div className="concept-check-box">
                  <strong>Concept Check</strong>
                  <p>{currentPage.conceptQuestion.prompt}</p>
                  <div className="concept-options">
                    {currentPage.conceptQuestion.options.map((option, index) => (
                      <label key={`${currentPage.id}-q-${index}`} className="sim-check">
                        <input
                          type="radio"
                          name={`concept-${currentPage.id}`}
                          checked={conceptAnswer === index}
                          onChange={() => setConceptAnswer(index)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="portal-actions">
                  <button type="button" className="btn btn-primary" onClick={validateAttempt}>
                    Validate Attempt
                  </button>
                </div>

                <p className="portal-subtitle">Attempts on this page: {attemptCount}</p>
              </aside>

              <div className="sim-workspace">
                <div className="explorer-panel">
                  <h3>Files</h3>
                  <p className="portal-subtitle">Double-click to open</p>

                  {fileTree.map((root) => (
                    <div key={root.id} className="file-tree">
                      <button type="button" className="folder-btn" onClick={() => toggleFolder(root.id)}>
                        {expandedFolders[root.id] ? "▾" : "▸"} {root.label}
                      </button>

                      {expandedFolders[root.id] &&
                        root.children.map((child) => (
                          <div key={child.id} className="file-indent">
                            <button type="button" className="folder-btn" onClick={() => toggleFolder(child.id)}>
                              {expandedFolders[child.id] ? "▾" : "▸"} {child.label}
                            </button>

                            {expandedFolders[child.id] &&
                              child.children.map((file) => (
                                <button
                                  key={file.id}
                                  type="button"
                                  className="file-btn"
                                  onDoubleClick={() => openWindow(file.type)}
                                  onClick={() => openWindow(file.type)}
                                >
                                  {file.label}
                                </button>
                              ))}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>

                <div className="desktop-canvas" ref={desktopRef}>
                  {windows.map((win) => (
                    <div
                      key={win.id}
                      className="desk-window excel-window"
                      style={{ left: win.x, top: win.y, zIndex: win.z }}
                      onMouseDown={() => bringFront(win.id)}
                    >
                      <div className="desk-titlebar" onMouseDown={(e) => startDrag(e, win.id)}>
                        <span>{fileLabel(win.type)}</span>
                        <button
                          type="button"
                          className="desk-close"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            closeWindow(win.id);
                          }}
                        >
                          ×
                        </button>
                      </div>

                      <div className="desk-tabs">
                        <button
                          type="button"
                          className={`desk-tab ${windowTabs[win.type] === "sheet" ? "active" : ""}`}
                          onClick={() => setWindowTabs((prev) => ({ ...prev, [win.type]: "sheet" }))}
                        >
                          Sheet
                        </button>
                        <button
                          type="button"
                          className={`desk-tab ${windowTabs[win.type] === "notes" ? "active" : ""}`}
                          onClick={() => setWindowTabs((prev) => ({ ...prev, [win.type]: "notes" }))}
                        >
                          Notes
                        </button>
                      </div>

                      {windowTabs[win.type] === "sheet" && (
                        <div className="excel-formula">
                          <span className="excel-fx">fx</span>
                          <input type="text" value={formulaHint(win.type)} readOnly />
                        </div>
                      )}

                      <div className="desk-body">
                        {windowTabs[win.type] === "notes" && (
                          <textarea className="desk-notes" defaultValue="Type your working notes here..." />
                        )}

                        {windowTabs[win.type] === "sheet" && win.type === "bank" && (
                          <div className="sim-table-wrap">
                            <table className="sim-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Date</th>
                                  <th>Description</th>
                                  <th>Amount</th>
                                  <th>Issue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentPage.bankEntries.map((entry, idx) => (
                                  <tr key={`${currentPage.id}-${entry.id}`}>
                                    <td>{idx + 1}</td>
                                    <td>{entry.date}</td>
                                    <td>{entry.description}</td>
                                    <td>{currency(entry.amount)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className={`sim-mark ${bankFlags.includes(entry.id) ? "active" : ""}`}
                                        onClick={() => toggleFlag(bankFlags, setBankFlags, entry.id)}
                                      >
                                        {bankFlags.includes(entry.id) ? "Flagged" : "Flag"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {windowTabs[win.type] === "sheet" && win.type === "ledger" && (
                          <div className="sim-table-wrap">
                            <table className="sim-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Date</th>
                                  <th>Account</th>
                                  <th>Memo</th>
                                  <th>Amount</th>
                                  <th>Issue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentPage.ledgerEntries.map((entry, idx) => (
                                  <tr key={`${currentPage.id}-${entry.id}`}>
                                    <td>{idx + 1}</td>
                                    <td>{entry.date}</td>
                                    <td>{entry.account}</td>
                                    <td>{entry.memo}</td>
                                    <td>{currency(entry.amount)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className={`sim-mark ${ledgerFlags.includes(entry.id) ? "active" : ""}`}
                                        onClick={() => toggleFlag(ledgerFlags, setLedgerFlags, entry.id)}
                                      >
                                        {ledgerFlags.includes(entry.id) ? "Flagged" : "Flag"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {windowTabs[win.type] === "sheet" && win.type === "adjustments" && (
                          <div className="sim-adjustments">
                            {currentPage.adjustmentOptions.map((option) => (
                              <label key={`${currentPage.id}-${option.id}`} className="sim-check">
                                <input
                                  type="checkbox"
                                  checked={selectedAdjustments.includes(option.id)}
                                  onChange={() => toggleAdjustment(option.id)}
                                />
                                <span>{option.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && finished && (
            <div className="auth-form">
              <h3>{isPractice ? "Practice Simulation Complete" : "Simulation Test Complete"}</h3>
              <p className="success">Good job. You completed the adaptive multi-page simulation.</p>
              <p className="portal-subtitle">Final Score: {score}%</p>

              {isPractice ? (
                <p className="portal-subtitle">Practice result is only visible to you and is not recorded.</p>
              ) : (
                <p className="portal-subtitle">This score is recorded and visible to your teacher.</p>
              )}

              {submitting && <p className="portal-subtitle">Saving score...</p>}

              <div className="score-table">
                <div className="score-row score-head">
                  <span>Key Concept</span>
                  <span>Result</span>
                  <span>Coverage</span>
                </div>
                {breakdown.map((item) => (
                  <div key={item.concept} className="score-row">
                    <span>{item.concept}</span>
                    <span>
                      {item.correct}/{item.total} ({item.percent}%)
                    </span>
                    <span>Adaptive</span>
                  </div>
                ))}
              </div>

              <div className="portal-actions">
                <button type="button" className="btn btn-primary" onClick={() => navigate("/student")}>
                  Back to Portal
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
