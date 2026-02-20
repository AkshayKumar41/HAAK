import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
  const saved = localStorage.getItem("intumotion_profile_name") || "";
  if (saved) return saved;

  const identity = localStorage.getItem("intumotion_identity") || "";
  if (identity.includes("@")) return identity.split("@")[0] || "Student";
  return identity || "Student";
}

function generateScenario() {
  const bankFee = randomBetween(35, 60);
  const duplicateVendorPayment = randomBetween(1400, 2400);

  return {
    bankFee,
    duplicateVendorPayment,
    bankEntries: [
      { id: "b1", date: "2026-02-10", description: "Client Deposit - Orion LLC", amount: 12250 },
      { id: "b2", date: "2026-02-12", description: "Payroll Batch", amount: -5200 },
      { id: "b3", date: "2026-02-13", description: "Office Rent", amount: -1800 },
      { id: "b4", date: "2026-02-14", description: "Bank Service Fee", amount: -bankFee },
      { id: "b5", date: "2026-02-15", description: "Client Deposit - Moss Retail", amount: 3750 },
    ],
    ledgerEntries: [
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
      { id: "l6", date: "2026-02-15", account: "Accounts Receivable", memo: "Moss Retail payment", amount: 3750 },
    ],
    adjustmentOptions: [
      {
        id: "adj-fee",
        label: `Record bank service fee expense ${currency(bankFee)} (Dr Bank Fees, Cr Cash)`,
      },
      {
        id: "adj-reverse-dup",
        label: `Reverse duplicate vendor payment ${currency(duplicateVendorPayment)} (Dr Cash, Cr Expense)` ,
      },
      {
        id: "adj-rent-accrual",
        label: "Accrue next month's rent expense",
      },
      {
        id: "adj-deferred-revenue",
        label: "Move deposit to deferred revenue",
      },
    ],
  };
}

function evaluateWork({ bankFlags, ledgerFlags, selectedAdjustments }) {
  const requiredAdjustments = ["adj-fee", "adj-reverse-dup"];

  const bankTaskDone = bankFlags.length === 1 && bankFlags.includes("b4");
  const ledgerTaskDone = ledgerFlags.length === 1 && ledgerFlags.includes("l5");
  const adjustmentTaskDone =
    selectedAdjustments.length === requiredAdjustments.length &&
    requiredAdjustments.every((id) => selectedAdjustments.includes(id));

  const tasks = [
    {
      id: "t1",
      concept: "Statement Analysis",
      label: "Identify the unrecorded bank fee on the bank statement",
      done: bankTaskDone,
    },
    {
      id: "t2",
      concept: "Error Detection",
      label: "Find the duplicate ledger vendor payment",
      done: ledgerTaskDone,
    },
    {
      id: "t3",
      concept: "Journal Adjustments",
      label: "Select the correct reconciliation adjustments",
      done: adjustmentTaskDone,
    },
  ];

  return {
    tasks,
    allDone: tasks.every((task) => task.done),
  };
}

function guidanceForConcept(concept, attempt) {
  if (concept === "Statement Analysis") {
    return `AI Coach: Compare bank-only lines against your ledger. Focus on charges that reduce cash but are not yet posted.`;
  }
  if (concept === "Error Detection") {
    return `AI Coach: Sort ledger by amount and memo. Repeated vendor checks on the same day often indicate duplicate posting.`;
  }
  if (concept === "Journal Adjustments") {
    return `AI Coach: Keep only entries that explain real reconciliation differences. Avoid unrelated accrual/deferral entries.`;
  }
  return `AI Coach: Re-check each task carefully. Attempt ${attempt}.`;
}

export default function StudentTestPage() {
  const { classId, assessmentId, mode } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeView, setActiveView] = useState("bank");
  const [bankFlags, setBankFlags] = useState([]);
  const [ledgerFlags, setLedgerFlags] = useState([]);
  const [selectedAdjustments, setSelectedAdjustments] = useState([]);

  const [attemptCount, setAttemptCount] = useState(0);
  const [taskSnapshot, setTaskSnapshot] = useState([]);
  const [conceptStats, setConceptStats] = useState({});
  const [coachMessage, setCoachMessage] = useState("AI Coach: Start by reviewing bank and ledger differences.");

  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isPractice = mode === "practice";

  const evaluation = useMemo(
    () => evaluateWork({ bankFlags, ledgerFlags, selectedAdjustments }),
    [bankFlags, ledgerFlags, selectedAdjustments]
  );

  const score = useMemo(() => {
    if (!finished) return 0;
    const completeWeight = Math.round((taskSnapshot.filter((t) => t.done).length / 3) * 70);
    const efficiency = Math.max(0, 30 - Math.max(0, attemptCount - 1) * 5);
    return Math.max(0, Math.min(100, completeWeight + efficiency));
  }, [finished, taskSnapshot, attemptCount]);

  const breakdown = useMemo(() => {
    return Object.entries(conceptStats).map(([concept, stat]) => ({
      concept,
      correct: stat.correct,
      total: stat.total,
      percent: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0,
    }));
  }, [conceptStats]);

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
        setScenario(generateScenario());
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [classId, assessmentId]);

  function toggleFlag(list, setList, id) {
    setList((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleAdjustment(id) {
    setSelectedAdjustments((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  async function validateAttempt() {
    if (finished) return;

    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);

    const result = evaluateWork({ bankFlags, ledgerFlags, selectedAdjustments });
    setTaskSnapshot(result.tasks);

    const nextStats = { ...conceptStats };
    result.tasks.forEach((task) => {
      const prev = nextStats[task.concept] || { correct: 0, total: 0 };
      nextStats[task.concept] = {
        correct: prev.correct + (task.done ? 1 : 0),
        total: prev.total + 1,
      };
    });
    setConceptStats(nextStats);

    if (result.allDone) {
      setCoachMessage("AI Coach: Great work. You reconciled all required differences.");
      const completeWeight = Math.round((result.tasks.filter((t) => t.done).length / 3) * 70);
      const efficiency = Math.max(0, 30 - Math.max(0, nextAttempt - 1) * 5);
      const finalScore = Math.max(0, Math.min(100, completeWeight + efficiency));
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
      return;
    }

    const weakest = result.tasks
      .filter((task) => !task.done)
      .map((task) => {
        const stat = nextStats[task.concept] || { correct: 0, total: 0 };
        const ratio = stat.total ? stat.correct / stat.total : 0;
        return { concept: task.concept, ratio };
      })
      .sort((a, b) => a.ratio - b.ratio)[0];

    setCoachMessage(guidanceForConcept(weakest?.concept, nextAttempt));
  }

  return (
    <div className="shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-grid" />

      <header className="site-header reveal">
        <Link className="brand" to="/student">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">intumotion</span>
        </Link>
        <nav>
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/student")}>
            Back to Portal
          </button>
        </nav>
      </header>

      <main>
        <section className="panel reveal">
          <h2>{isPractice ? "Practice Simulation" : "Adaptive Simulation Test"}</h2>
          <p className="portal-subtitle">
            {assessment?.className || "Class"} • {assessment?.title || "Assessment"}
          </p>

          {loading && <p className="portal-subtitle">Generating reconciliation simulation...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !finished && scenario && (
            <div className="sim-layout">
              <aside className="sim-sidebar">
                <h3>Task</h3>
                <p className="portal-subtitle">Reconcile revenue and cash activity for this period.</p>
                <div className="task-list">
                  {evaluation.tasks.map((task) => (
                    <div key={task.id} className={`task-item ${task.done ? "done" : ""}`}>
                      <strong>{task.done ? "Done" : "Open"}</strong>
                      <span>{task.label}</span>
                    </div>
                  ))}
                </div>

                <div className="coach-box">
                  <strong>Adaptive AI Guidance</strong>
                  <p>{coachMessage}</p>
                </div>

                <div className="portal-actions">
                  <button type="button" className="btn btn-primary" onClick={validateAttempt}>
                    Validate Attempt
                  </button>
                </div>
                <p className="portal-subtitle">Attempts: {attemptCount}</p>
              </aside>

              <div className="sim-main">
                <div className="sim-tabs">
                  <button
                    type="button"
                    className={`sim-tab ${activeView === "bank" ? "active" : ""}`}
                    onClick={() => setActiveView("bank")}
                  >
                    Bank Statement
                  </button>
                  <button
                    type="button"
                    className={`sim-tab ${activeView === "ledger" ? "active" : ""}`}
                    onClick={() => setActiveView("ledger")}
                  >
                    Ledger
                  </button>
                  <button
                    type="button"
                    className={`sim-tab ${activeView === "adjustments" ? "active" : ""}`}
                    onClick={() => setActiveView("adjustments")}
                  >
                    Adjustments
                  </button>
                </div>

                {activeView === "bank" && (
                  <div className="sim-table-wrap">
                    <table className="sim-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Mark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenario.bankEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.date}</td>
                            <td>{entry.description}</td>
                            <td>{currency(entry.amount)}</td>
                            <td>
                              <button
                                type="button"
                                className={`sim-mark ${bankFlags.includes(entry.id) ? "active" : ""}`}
                                onClick={() => toggleFlag(bankFlags, setBankFlags, entry.id)}
                              >
                                {bankFlags.includes(entry.id) ? "Marked" : "Mark Issue"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeView === "ledger" && (
                  <div className="sim-table-wrap">
                    <table className="sim-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Account</th>
                          <th>Memo</th>
                          <th>Amount</th>
                          <th>Mark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenario.ledgerEntries.map((entry) => (
                          <tr key={entry.id}>
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
                                {ledgerFlags.includes(entry.id) ? "Marked" : "Mark Issue"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeView === "adjustments" && (
                  <div className="sim-adjustments">
                    {scenario.adjustmentOptions.map((option) => (
                      <label key={option.id} className="sim-check">
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
          )}

          {!loading && finished && (
            <div className="auth-form">
              <h3>{isPractice ? "Practice Simulation Complete" : "Simulation Test Complete"}</h3>
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
