import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function fakeGenerateTest({ title, prompt, keyConcepts, files }) {
  const now = new Date().toLocaleString();
  const conceptsLine = keyConcepts.length ? keyConcepts.join(", ") : "No key concepts provided";
  const fileLine = files.length ? files.map((file) => file.name).join(", ") : "No files uploaded";

  return `Sample Generated Test\nGenerated: ${now}\n\nAssessment: ${title}\n\nTeacher Prompt:\n${prompt}\n\nKey Concepts:\n- ${conceptsLine}\n\nAttached Sources:\n- ${fileLine}\n\nSection A (MCQ)\n1) Which option best applies the core concept?\n2) Select the strongest justification.\n\nSection B (Short Answer)\n1) Explain your approach in 3-5 sentences.\n2) Identify one common error and how to avoid it.\n\nScoring Rubric\n- Accuracy: 40%\n- Clarity: 30%\n- Reasoning: 30%`;
}

export default function TeacherPortalPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [menuOpenClassId, setMenuOpenClassId] = useState("");
  const [panelMode, setPanelMode] = useState("assessment");
  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editKeyConcepts, setEditKeyConcepts] = useState([]);
  const [newKeyConcept, setNewKeyConcept] = useState("");
  const [editFiles, setEditFiles] = useState([]);
  const [generatedQuizPreview, setGeneratedQuizPreview] = useState(null);
  const [generatedSample, setGeneratedSample] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editClassStatus, setEditClassStatus] = useState("Active");
  const [studentDraft, setStudentDraft] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch("/api/teacher/classes");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load classes");

        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(data[0].id);
          setSelectedAssessmentId(data[0].assessments?.[0]?.id || "");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setIsLoading(false);
      }
    }

    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setEditClassName(selectedClass.name);
      setEditClassStatus(selectedClass.status || "Active");
    }
  }, [selectedClass]);

  useEffect(() => {
    if (panelMode === "assessment" && selectedAssessment) {
      setEditTitle(selectedAssessment.title);
      setEditPrompt(selectedAssessment.prompt);
      setEditKeyConcepts(Array.isArray(selectedAssessment.keyConcepts) ? selectedAssessment.keyConcepts : []);
      setEditFiles(Array.isArray(selectedAssessment.files) ? selectedAssessment.files : []);
      setGeneratedQuizPreview(selectedAssessment.generatedQuiz || null);
      setNewKeyConcept("");
      setGeneratedSample("");
    }
  }, [selectedAssessment, panelMode]);

  function switchClass(classId) {
    const foundClass = classes.find((item) => item.id === classId);
    if (!foundClass) return;
    setSelectedClassId(classId);
    setSelectedAssessmentId(foundClass.assessments?.[0]?.id || "");
    setPanelMode("assessment");
    setMenuOpenClassId("");
    setError("");
  }

  async function createClass(e) {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName, status: "Active" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Create class endpoint not found. Restart backend to load latest routes.");
        }
        throw new Error(data?.error || "Failed to create class");
      }

      const updated = [data, ...classes];
      setClasses(updated);
      setSelectedClassId(data.id);
      setSelectedAssessmentId("");
      setNewClassName("");
      setShowNewClassModal(false);
      setPanelMode("assessment");
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function saveClassDetails(e) {
    e.preventDefault();
    if (!selectedClass) return;

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/teacher/classes/${selectedClass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editClassName, status: editClassStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update class");

      setClasses((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setPanelMode("assessment");
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteClass(classId) {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/teacher/classes/${classId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete class");
      }

      const updated = classes.filter((item) => item.id !== classId);
      setClasses(updated);
      setSelectedClassId(updated[0]?.id || "");
      setSelectedAssessmentId(updated[0]?.assessments?.[0]?.id || "");
      setPanelMode("assessment");
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
      setMenuOpenClassId("");
    }
  }

  async function saveStudents(students) {
    if (!selectedClass) return;
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/teacher/classes/${selectedClass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update students");
      setClasses((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function createAssessment(e) {
    e.preventDefault();
    const title = newTitle.trim();
    const prompt = newPrompt.trim();
    if (!title || !prompt || !selectedClass) return;

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/teacher/classes/${selectedClass.id}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, prompt, keyConcepts: [], files: [] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create assessment");

      setClasses((prev) =>
        prev.map((item) =>
          item.id === selectedClass.id ? { ...item, assessments: [data, ...item.assessments] } : item
        )
      );
      setSelectedAssessmentId(data.id);
      setNewTitle("");
      setNewPrompt("");
      setPanelMode("assessment");
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAssessmentSpecs(e) {
    e.preventDefault();
    if (!selectedClass || !selectedAssessment) return;

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teacher/classes/${selectedClass.id}/assessments/${selectedAssessment.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle,
            prompt: editPrompt,
            keyConcepts: editKeyConcepts.map((item) => item.trim()).filter(Boolean),
            files: editFiles,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save assessment");

      setClasses((prev) =>
        prev.map((classItem) =>
          classItem.id !== selectedClass.id
            ? classItem
            : {
                ...classItem,
                assessments: classItem.assessments.map((assessment) =>
                  assessment.id === data.id ? data : assessment
                ),
              }
        )
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function generateLiveQuiz() {
    if (!selectedClass || !selectedAssessment) return;

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teacher/classes/${selectedClass.id}/assessments/${selectedAssessment.id}/generate-live-quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: editPrompt,
            keyConcepts: editKeyConcepts.map((item) => item.trim()).filter(Boolean),
          }),
        }
      );
      const generated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(generated?.error || "Failed to generate live quiz");

      setGeneratedQuizPreview(generated);
      setClasses((prev) =>
        prev.map((classItem) =>
          classItem.id !== selectedClass.id
            ? classItem
            : {
                ...classItem,
                assessments: classItem.assessments.map((assessment) =>
                  assessment.id === selectedAssessment.id
                    ? { ...assessment, generatedQuiz: generated }
                    : assessment
                ),
              }
        )
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAssessment() {
    if (!selectedClass || !selectedAssessment) return;

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teacher/classes/${selectedClass.id}/assessments/${selectedAssessment.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete assessment");
      }

      const updatedClasses = classes.map((classItem) =>
        classItem.id !== selectedClass.id
          ? classItem
          : {
              ...classItem,
              assessments: classItem.assessments.filter((item) => item.id !== selectedAssessment.id),
            }
      );

      setClasses(updatedClasses);
      const updatedSelectedClass = updatedClasses.find((item) => item.id === selectedClass.id);
      setSelectedAssessmentId(updatedSelectedClass?.assessments?.[0]?.id || "");
      setPanelMode("assessment");
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setEditFiles((prev) => [...prev, ...files]);
  }

  async function persistKeyConcepts(nextConcepts) {
    if (!selectedClass || !selectedAssessment) return;

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teacher/classes/${selectedClass.id}/assessments/${selectedAssessment.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle,
            prompt: editPrompt,
            keyConcepts: nextConcepts.map((item) => item.trim()).filter(Boolean),
            files: editFiles,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save key concepts");

      setClasses((prev) =>
        prev.map((classItem) =>
          classItem.id !== selectedClass.id
            ? classItem
            : {
                ...classItem,
                assessments: classItem.assessments.map((assessment) =>
                  assessment.id === data.id ? data : assessment
                ),
              }
        )
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function saveKeyConcept() {
    const value = newKeyConcept.trim();
    if (!value) return;
    const nextConcepts = [...editKeyConcepts, value];
    setEditKeyConcepts(nextConcepts);
    setNewKeyConcept("");
    await persistKeyConcepts(nextConcepts);
  }

  async function removeKeyConcept(index) {
    const nextConcepts = editKeyConcepts.filter((_, i) => i !== index);
    setEditKeyConcepts(nextConcepts);
    await persistKeyConcepts(nextConcepts);
  }

  function addStudent() {
    const name = studentDraft.trim();
    if (!name || !selectedClass) return;
    saveStudents([...(selectedClass.students || []), name]);
    setStudentDraft("");
  }

  function removeStudent(index) {
    if (!selectedClass) return;
    const next = (selectedClass.students || []).filter((_, i) => i !== index);
    saveStudents(next);
  }

  function openClassPanel(mode, classId) {
    switchClass(classId);
    setPanelMode(mode);
    setMenuOpenClassId("");
  }

  return (
    <div className="shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-grid" />

      <header className="site-header reveal">
        <Link className="brand" to="/">
          <img className="brand-logo" src="/IntuMotion.png" alt="IntuMotion logo" />
          <span className="brand-text">IntuMotion</span>
        </Link>
        <nav>
          <Link to="/" className="nav-cta">
            Home
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => setShowNewClassModal(true)}>
            New Class
          </button>
          <Link to="/teacher/profile" className="teacher-icon-btn" aria-label="My Profile">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 12a4.75 4.75 0 1 0-4.75-4.75A4.76 4.76 0 0 0 12 12zm0 2c-3.7 0-7 1.89-7 4.2V20h14v-1.8c0-2.31-3.3-4.2-7-4.2z"
              />
            </svg>
          </Link>
        </nav>
      </header>

      <main>
        <section className={`panel reveal dashboard-panel ${menuOpenClassId ? "menu-open" : ""}`}>
          <h2>Teacher Portal Dashboard</h2>
          <p className="portal-subtitle">Active Classes</p>

          {isLoading && <p className="portal-subtitle">Loading classes...</p>}

          {!isLoading && (
            <div className="class-grid">
              {classes.map((classItem) => (
                <div key={classItem.id} className="class-card-wrap">
                  <button
                    type="button"
                    onClick={() => switchClass(classItem.id)}
                    className={`class-card ${selectedClassId === classItem.id ? "selected" : ""}`}
                  >
                    <strong>{classItem.name}</strong>
                    <span>{classItem.status}</span>
                    <small>{(classItem.students || []).length} students</small>
                  </button>

                  <button
                    type="button"
                    className="class-menu-trigger"
                    onClick={() => setMenuOpenClassId(menuOpenClassId === classItem.id ? "" : classItem.id)}
                    aria-label="Class options"
                  >
                    ...
                  </button>

                  {menuOpenClassId === classItem.id && (
                    <div className="class-menu">
                      <button type="button" onClick={() => openClassPanel("editClass", classItem.id)}>
                        Edit Class
                      </button>
                      <button type="button" onClick={() => openClassPanel("students", classItem.id)}>
                        Manage Students
                      </button>
                      <button type="button" className="danger" onClick={() => deleteClass(classItem.id)}>
                        Delete Class
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="portal-layout reveal">
          <article className="panel portal-column">
            <div className="portal-head">
              <h3>{selectedClass?.name || "Class"}</h3>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPanelMode("newAssessment")}
                disabled={!selectedClass || isSaving}
              >
                New
              </button>
            </div>

            <p className="portal-subtitle">Assessments</p>
            <div className="assessment-list">
              {(selectedClass?.assessments || []).map((assessment) => (
                <button
                  key={assessment.id}
                  type="button"
                  onClick={() => {
                    setSelectedAssessmentId(assessment.id);
                    setPanelMode("assessment");
                  }}
                  className={`assessment-item ${selectedAssessmentId === assessment.id ? "selected" : ""}`}
                >
                  {assessment.title}
                </button>
              ))}
            </div>
          </article>

          <article className="panel portal-column">
            {panelMode === "editClass" && selectedClass && (
              <form className="auth-form" onSubmit={saveClassDetails}>
                <h3>Edit Class</h3>
                <label htmlFor="edit-class-name">Class Name</label>
                <input
                  id="edit-class-name"
                  type="text"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                />
                <label htmlFor="edit-class-status">Status</label>
                <input
                  id="edit-class-status"
                  type="text"
                  value={editClassStatus}
                  onChange={(e) => setEditClassStatus(e.target.value)}
                />
                <div className="portal-actions">
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    Save Class
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setPanelMode("assessment")}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {panelMode === "students" && selectedClass && (
              <div className="auth-form">
                <h3>Manage Students</h3>
                <div className="student-add-row">
                  <input
                    type="text"
                    value={studentDraft}
                    onChange={(e) => setStudentDraft(e.target.value)}
                    placeholder="Student full name"
                  />
                  <button type="button" className="btn btn-primary" onClick={addStudent} disabled={isSaving}>
                    Add
                  </button>
                </div>

                <div className="student-list">
                  {(selectedClass.students || []).map((student, index) => (
                    <div key={`${student}-${index}`} className="student-item">
                      <span>{student}</span>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeStudent(index)}
                        disabled={isSaving}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {panelMode === "newAssessment" && (
              <form className="auth-form" onSubmit={createAssessment}>
                <h3>New Assessment</h3>
                <label htmlFor="assessment-title">Title</label>
                <input
                  id="assessment-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Assessment title"
                />

                <label htmlFor="assessment-prompt">Prompt / Test Content</label>
                <textarea
                  id="assessment-prompt"
                  className="prompt-editor"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Edit and write the assessment content here"
                />

                <div className="portal-actions">
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    Save Assessment
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setPanelMode("assessment")}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {panelMode === "assessment" && selectedAssessment && (
              <form className="auth-form" onSubmit={saveAssessmentSpecs}>
                <h3>Edit Assessment</h3>
                <label htmlFor="edit-assessment-title">Title</label>
                <input
                  id="edit-assessment-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />

                <label htmlFor="edit-assessment-prompt">Prompt / Specs</label>
                <textarea
                  id="edit-assessment-prompt"
                  className="prompt-editor"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                />

                <div className="kpi-head">
                  <label>Key Concepts</label>
                </div>

                <div className="kpi-item">
                  <input
                    type="text"
                    value={newKeyConcept}
                    onChange={(e) => setNewKeyConcept(e.target.value)}
                    placeholder="Add a key concept"
                  />
                  <button type="button" className="btn btn-primary" onClick={saveKeyConcept}>
                    Save
                  </button>
                </div>

                <div className="kpi-list">
                  {editKeyConcepts.map((concept, index) => (
                    <div key={`concept-${index}`} className="kpi-item">
                      <input type="text" value={concept} readOnly />
                      <button type="button" className="btn btn-danger" onClick={() => removeKeyConcept(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <label htmlFor="assessment-files">Upload files</label>
                <input id="assessment-files" type="file" multiple onChange={handleFileUpload} />
                <div className="file-list">
                  {editFiles.map((file, idx) => (
                    <p key={`${file.name}-${idx}`} className="file-pill">
                      {file.name}
                    </p>
                  ))}
                </div>

                <div className="portal-actions">
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    Save Assessment
                  </button>
                  <button type="button" className="btn btn-danger" onClick={deleteAssessment} disabled={isSaving}>
                    Delete
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={generateLiveQuiz} disabled={isSaving}>
                    Generate Realistic Test
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setGeneratedSample(
                        fakeGenerateTest({
                          title: editTitle,
                          prompt: editPrompt,
                          keyConcepts: editKeyConcepts,
                          files: editFiles,
                        })
                      )
                    }
                  >
                    Generate Sample Test
                  </button>
                </div>

                {generatedSample && (
                  <>
                    <p className="portal-subtitle">Sample Generated Test (Fake AI Output)</p>
                    <pre className="prompt-box">{generatedSample}</pre>
                  </>
                )}

                {generatedQuizPreview && (
                  <>
                    <p className="portal-subtitle">Live Generated Test Style</p>
                    <div className="prompt-box">
                      <p>
                        <strong>Profile:</strong> {generatedQuizPreview.realismProfile}
                      </p>
                      <p>
                        <strong>Pages:</strong> {(generatedQuizPreview.pages || []).length}
                      </p>
                      <p>
                        <strong>Case References:</strong>
                      </p>
                      <ul>
                        {(generatedQuizPreview.caseReferences || []).map((ref) => (
                          <li key={ref.tag}>
                            {ref.title} ({ref.sourceHint})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <p className="portal-subtitle">Recorded Student Scores</p>
                <div className="score-table">
                  <div className="score-row score-head">
                    <span>Student</span>
                    <span>Score</span>
                    <span>Submitted</span>
                  </div>
                  {(selectedAssessment.scores || []).length === 0 && (
                    <div className="score-row">
                      <span>No recorded tests yet.</span>
                      <span>-</span>
                      <span>-</span>
                    </div>
                  )}
                  {(selectedAssessment.scores || []).map((entry) => (
                    <div className="score-row" key={entry.id}>
                      <span>{entry.studentName}</span>
                      <span>{entry.score}%</span>
                      <span>{new Date(entry.submittedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </form>
            )}

            {panelMode === "assessment" && !selectedAssessment && (
              <p className="portal-subtitle">No assessments yet for this class. Click New to create one.</p>
            )}

            {error && <p className="error">{error}</p>}
          </article>
        </section>

        {showNewClassModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <form className="auth-form" onSubmit={createClass}>
                <h3>Create New Class</h3>
                <label htmlFor="new-class-name">Class Name</label>
                <input
                  id="new-class-name"
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Physics 101"
                />
                <div className="portal-actions">
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    Create Class
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowNewClassModal(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
