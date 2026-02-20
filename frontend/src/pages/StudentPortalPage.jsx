import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function StudentPortalPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const selectedAssessment = useMemo(() => {
    if (!selectedClass) return null;
    return selectedClass.assessments.find((item) => item.id === selectedAssessmentId) || null;
  }, [selectedClass, selectedAssessmentId]);

  useEffect(() => {
    async function loadClasses() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/student/classes");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load classes");

        const active = (data || []).filter((item) => item.status?.toLowerCase() === "active");
        setClasses(active);
        if (active.length > 0) {
          setSelectedClassId(active[0].id);
          setSelectedAssessmentId(active[0].assessments?.[0]?.id || "");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  function logout() {
    localStorage.removeItem("IntuMotion_role");
    navigate("/login");
  }

  function openTest(mode) {
    if (!selectedClass || !selectedAssessment) return;
    navigate(`/student/classes/${selectedClass.id}/assessments/${selectedAssessment.id}/${mode}`);
  }

  return (
    <div className="shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-grid" />

      <header className="site-header reveal">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">IntuMotion</span>
        </Link>
        <nav>
          <Link to="/" className="nav-cta">
            Home
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log Out
          </button>
        </nav>
      </header>

      <main>
        <section className="panel reveal">
          <h2>Student Portal</h2>
          <p className="portal-subtitle">Your Active Classes</p>

          {loading && <p className="portal-subtitle">Loading classes...</p>}

          {!loading && (
            <div className="class-grid">
              {classes.map((classItem) => (
                <button
                  key={classItem.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassId(classItem.id);
                    setSelectedAssessmentId(classItem.assessments?.[0]?.id || "");
                  }}
                  className={`class-card ${selectedClassId === classItem.id ? "selected" : ""}`}
                >
                  <strong>{classItem.name}</strong>
                  <span>{classItem.status}</span>
                  <small>{(classItem.assessments || []).length} assessments</small>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="portal-layout reveal">
          <article className="panel portal-column">
            <h3>{selectedClass?.name || "Class"}</h3>
            <p className="portal-subtitle">Assessments</p>
            <div className="assessment-list">
              {(selectedClass?.assessments || []).map((assessment) => (
                <button
                  key={assessment.id}
                  type="button"
                  onClick={() => setSelectedAssessmentId(assessment.id)}
                  className={`assessment-item ${selectedAssessmentId === assessment.id ? "selected" : ""}`}
                >
                  {assessment.title}
                </button>
              ))}
            </div>
          </article>

          <article className="panel portal-column">
            {selectedAssessment ? (
              <>
                <h3>{selectedAssessment.title}</h3>
                <p className="portal-subtitle">Assessment Prompt</p>
                <pre className="prompt-box">{selectedAssessment.prompt}</pre>

                <p className="portal-subtitle">Key Concepts</p>
                <div className="file-list">
                  {(selectedAssessment.keyConcepts || []).map((concept, idx) => (
                    <p key={`${concept}-${idx}`} className="file-pill">
                      {concept}
                    </p>
                  ))}
                </div>

                <div className="portal-actions" style={{ marginTop: "0.9rem" }}>
                  <button type="button" className="btn btn-primary" onClick={() => openTest("test")}>
                    Take Test
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => openTest("practice")}>
                    Take Practice Test
                  </button>
                </div>
              </>
            ) : (
              <p className="portal-subtitle">Select an assessment to view details.</p>
            )}

            {error && <p className="error">{error}</p>}
          </article>
        </section>
      </main>
    </div>
  );
}
