import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function getStudentName() {
  const saved = localStorage.getItem("IntuMotion_profile_name") || "";
  if (saved) return saved;
  const identity = localStorage.getItem("IntuMotion_identity") || "";
  if (identity.includes("@")) return identity.split("@")[0] || "Student";
  return identity || "Student";
}

export default function StudentExamPage() {
  const { classId, assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const [heatFixed, setHeatFixed] = useState(false);
  const [fixative, setFixative] = useState("none");
  const [primaryStain, setPrimaryStain] = useState("none");
  const [rinseSeconds, setRinseSeconds] = useState(3);
  const [focusLevel, setFocusLevel] = useState("10x");
  const [safetySteps, setSafetySteps] = useState({
    gloves: false,
    labelSlide: false,
    controlsPrepared: false,
  });
  const [result, setResult] = useState(null);

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
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [classId, assessmentId]);

  const isBiologyLab = useMemo(() => {
    const text = `${assessment?.className || ""} ${assessment?.title || ""} ${assessment?.prompt || ""}`.toLowerCase();
    return text.includes("biology") || text.includes("cell") || text.includes("stain") || text.includes("microscopy");
  }, [assessment]);

  const progress = useMemo(() => {
    const checkpoints = [
      heatFixed,
      fixative !== "none",
      primaryStain !== "none",
      rinseSeconds >= 5 && rinseSeconds <= 12,
      focusLevel === "40x" || focusLevel === "100x oil",
      safetySteps.gloves,
      safetySteps.labelSlide,
      safetySteps.controlsPrepared,
    ];
    const done = checkpoints.filter(Boolean).length;
    return Math.round((done / checkpoints.length) * 100);
  }, [heatFixed, fixative, primaryStain, rinseSeconds, focusLevel, safetySteps]);

  async function submitFinalScore(finalScore, breakdown) {
    setSubmitting(true);
    setError("");
    try {
      await fetch(`/api/student/classes/${classId}/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: getStudentName(),
          score: finalScore,
          breakdown,
        }),
      });
    } catch {
      setError("Could not submit score to teacher portal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function runBiologySimulation() {
    if (finished) return;

    const protocol = {
      heatFixing: heatFixed,
      fixationChoice: fixative !== "none",
      stainChoice: primaryStain === "methylene-blue" || primaryStain === "crystal-violet",
      rinseWindow: rinseSeconds >= 5 && rinseSeconds <= 12,
      microscopeFocus: focusLevel === "40x" || focusLevel === "100x oil",
      safetyPrep: safetySteps.gloves && safetySteps.labelSlide && safetySteps.controlsPrepared,
    };

    const pointsPerCheck = 100 / Object.keys(protocol).length;
    const finalScore = Math.round(
      Object.values(protocol).reduce((acc, ok) => acc + (ok ? pointsPerCheck : 0), 0)
    );

    const notes = [];
    if (!protocol.heatFixing) notes.push("Missing heat-fix step may cause sample loss during rinse.");
    if (!protocol.fixationChoice) notes.push("Select a fixative to preserve morphology before staining.");
    if (!protocol.stainChoice) notes.push("Primary stain should be methylene blue or crystal violet for this task.");
    if (!protocol.rinseWindow) notes.push("Rinse should be controlled between 5-12s to avoid over/under washing.");
    if (!protocol.microscopeFocus) notes.push("Final verification should be at 40x or 100x oil for detail.");
    if (!protocol.safetyPrep) notes.push("Complete PPE and slide labeling controls before imaging.");
    if (notes.length === 0) notes.push("Excellent protocol execution. Slide quality is microscopy-ready.");

    setResult({
      notes,
      protocol,
    });
    setScore(finalScore);
    setFinished(true);

    await submitFinalScore(finalScore, [
      { concept: "Staining protocol", correct: protocol.stainChoice ? 1 : 0, total: 1 },
      { concept: "Sample preparation", correct: protocol.heatFixing && protocol.fixationChoice ? 1 : 0, total: 1 },
      { concept: "Microscopy readiness", correct: protocol.rinseWindow && protocol.microscopeFocus ? 1 : 0, total: 1 },
      { concept: "Lab safety controls", correct: protocol.safetyPrep ? 1 : 0, total: 1 },
    ]);
  }

  if (loading) {
    return (
      <div className="shell">
        <main>
          <section className="panel reveal">
            <h2>Loading Test...</h2>
          </section>
        </main>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="shell">
        <main>
          <section className="panel reveal">
            <h2>Test Not Found</h2>
            <p className="error">{error || "Assessment could not be loaded."}</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-grid" />

      <header className="site-header reveal">
        <Link className="brand" to="/student">
          <img className="brand-logo" src="/IntuMotion.png" alt="IntuMotion logo" />
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
          <h2>Take Test</h2>
          <p className="portal-subtitle">
            {assessment.className} • {assessment.title}
          </p>

          {!isBiologyLab && (
            <div className="sim-progress-wrap">
              <div className="sim-progress-meta">
                <strong>Test Setup Progress</strong>
                <span>{progress}%</span>
              </div>
              <div className="sim-progress-track">
                <div className="sim-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="exam-layout">
            <aside className="sim-sidebar">
              <h3>{isBiologyLab ? "Cell Staining Simulator" : "Standard Test Simulator"}</h3>
              <p className="portal-subtitle">
                {isBiologyLab
                  ? "Prepare a stained slide for microscopy. Configure technique, staining, rinse timing, and focus."
                  : "Complete all required setup fields, then run the test simulation."}
              </p>

              <div className="auth-form">
                <label className="exam-control">
                  <input type="checkbox" checked={heatFixed} onChange={(e) => setHeatFixed(e.target.checked)} />
                  <span>Heat-fix the smear before staining</span>
                </label>

                <label htmlFor="fixative-select">Fixative</label>
                <select id="fixative-select" value={fixative} onChange={(e) => setFixative(e.target.value)}>
                  <option value="none">Select fixative</option>
                  <option value="methanol">Methanol</option>
                  <option value="formalin">Formalin</option>
                </select>

                <label htmlFor="stain-select">Primary Stain</label>
                <select id="stain-select" value={primaryStain} onChange={(e) => setPrimaryStain(e.target.value)}>
                  <option value="none">Select stain</option>
                  <option value="methylene-blue">Methylene Blue</option>
                  <option value="crystal-violet">Crystal Violet</option>
                  <option value="safranin">Safranin</option>
                </select>

                <label htmlFor="rinse-range">Rinse Duration ({rinseSeconds}s)</label>
                <input
                  id="rinse-range"
                  type="range"
                  min="1"
                  max="20"
                  value={rinseSeconds}
                  onChange={(e) => setRinseSeconds(Number(e.target.value))}
                />

                <label htmlFor="focus-select">Microscope Focus Stage</label>
                <select id="focus-select" value={focusLevel} onChange={(e) => setFocusLevel(e.target.value)}>
                  <option value="4x">4x</option>
                  <option value="10x">10x</option>
                  <option value="40x">40x</option>
                  <option value="100x oil">100x oil</option>
                </select>
              </div>

              <p className="portal-subtitle">Lab Controls</p>
              <div className="sim-adjustments">
                <label className="sim-check">
                  <input
                    type="checkbox"
                    checked={safetySteps.gloves}
                    onChange={(e) => setSafetySteps((prev) => ({ ...prev, gloves: e.target.checked }))}
                  />
                  <span>PPE on (gloves + eyewear)</span>
                </label>
                <label className="sim-check">
                  <input
                    type="checkbox"
                    checked={safetySteps.labelSlide}
                    onChange={(e) => setSafetySteps((prev) => ({ ...prev, labelSlide: e.target.checked }))}
                  />
                  <span>Slide clearly labeled before staining</span>
                </label>
                <label className="sim-check">
                  <input
                    type="checkbox"
                    checked={safetySteps.controlsPrepared}
                    onChange={(e) => setSafetySteps((prev) => ({ ...prev, controlsPrepared: e.target.checked }))}
                  />
                  <span>Positive and negative control slides prepared</span>
                </label>
              </div>

              <div className="portal-actions" style={{ marginTop: "0.8rem" }}>
                <button type="button" className="btn btn-primary" onClick={runBiologySimulation} disabled={finished}>
                  Run Test Simulation
                </button>
              </div>
            </aside>

            <div className="sim-main exam-main">
              <h3>Microscopy Bench View</h3>
              <div className="microscope-view">
                <div className={`cell-field ${primaryStain !== "none" ? "stained" : ""}`}>
                  <div className="cell-dot" />
                  <div className="cell-dot" />
                  <div className="cell-dot" />
                  <div className="cell-dot" />
                  <div className="cell-dot" />
                </div>
              </div>

              <div className="score-table" style={{ marginTop: "0.8rem" }}>
                <div className="score-row score-head">
                  <span>Protocol Signal</span>
                  <span>Status</span>
                  <span>Expected</span>
                </div>
                <div className="score-row">
                  <span>Fixation complete</span>
                  <span>{heatFixed && fixative !== "none" ? "Ready" : "Incomplete"}</span>
                  <span>Heat-fix + fixative</span>
                </div>
                <div className="score-row">
                  <span>Stain selection</span>
                  <span>{primaryStain === "none" ? "Missing" : primaryStain.replace("-", " ")}</span>
                  <span>Methylene blue / Crystal violet</span>
                </div>
                <div className="score-row">
                  <span>Rinse timing</span>
                  <span>{rinseSeconds}s</span>
                  <span>5s to 12s</span>
                </div>
                <div className="score-row">
                  <span>Focus verification</span>
                  <span>{focusLevel}</span>
                  <span>40x or 100x oil</span>
                </div>
              </div>

              {finished && result && (
                <div className="auth-form" style={{ marginTop: "1rem" }}>
                  <h3>Test Complete</h3>
                  <p className="success">Final Score: {score}%</p>
                  {result.notes.map((note) => (
                    <p key={note} className="portal-subtitle">
                      {note}
                    </p>
                  ))}
                  {submitting && <p className="portal-subtitle">Saving score...</p>}
                </div>
              )}
            </div>
          </div>

          {error && <p className="error">{error}</p>}
        </section>
      </main>
    </div>
  );
}
