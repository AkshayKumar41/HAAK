import { useState } from "react";

const highlights = [
  {
    title: "Teacher-Controlled AI",
    text: "Instructors upload lesson plans, approve AI-generated scenarios, and guide every class outcome.",
  },
  {
    title: "Adaptive, Low-Stress Learning",
    text: "Difficulty shifts gently based on student responses to protect confidence and drive real mastery.",
  },
  {
    title: "Real-World Simulations",
    text: "Students practice through practical settings like offices, labs, and architecture studios.",
  },
];

const steps = [
  "Teacher uploads lesson materials.",
  "AI translates lessons into easier, scenario-based modules.",
  "Students complete adaptive simulations with guided coaching.",
  "Platform returns strengths, gaps, and next-step suggestions.",
];

export default function App() {
  const [role, setRole] = useState("student");

  return (
    <div className="shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-grid" />

      <header className="site-header reveal">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">
            intumotion<span>.ai</span>
          </span>
        </a>
        <nav>
          <a href="#vision">Vision</a>
          <a href="#flow">Flow</a>
          <a href="#auth" className="nav-cta">
            Get Started
          </a>
        </nav>
      </header>

      <main>
        <section className="hero reveal" id="top">
          <div className="hero-copy">
            <p className="kicker">Mastery in Motion</p>
            <h1>AI-powered learning that supports teachers and reduces student pressure.</h1>
            <p className="hero-sub">
              Turn lesson plans into guided, real-world scenarios where students build understanding with confidence.
            </p>
            <div className="hero-actions">
              <a href="#auth" className="btn btn-primary">
                Start as Student
              </a>
              <a href="#auth" className="btn btn-ghost">
                Start as Institution
              </a>
            </div>
          </div>

          <article className="preview-card reveal-stagger">
            <h3>Live Preview</h3>
            <p className="preview-title">Accounting Scenario: Office Reconciliation</p>
            <ul>
              <li>
                <span>Environment</span>
                <strong>Finance workplace simulation</strong>
              </li>
              <li>
                <span>Mode</span>
                <strong>Supportive adaptive coaching</strong>
              </li>
              <li>
                <span>Outcome</span>
                <strong>Mastery path + confidence summary</strong>
              </li>
            </ul>
          </article>
        </section>

        <section id="vision" className="panel reveal">
          <h2>Built for mastery, wellbeing, and measurable growth.</h2>
          <div className="panel-grid">
            {highlights.map((item) => (
              <article className="feature-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="flow" className="flow reveal">
          <h2>How IntuMotion Works</h2>
          <div className="steps">
            {steps.map((step, index) => (
              <div className="step" key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="auth" className="auth reveal">
          <div className="auth-card">
            <div className="auth-head">
              <h2>Login / Sign Up</h2>
              <p>Choose your identity and role to personalize your learning journey.</p>
            </div>

            <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="identity">Email or Username</label>
              <input id="identity" type="text" placeholder="name@school.edu or username" />

              <label htmlFor="password">Password</label>
              <input id="password" type="password" placeholder="Enter your password" />

              <button type="submit" className="btn btn-primary btn-full">
                Continue
              </button>

              <div className="divider">
                <span>or continue with</span>
              </div>

              <div className="social">
                <button type="button" className="btn btn-social">
                  Google
                </button>
                <button type="button" className="btn btn-social">
                  Apple
                </button>
              </div>

              <p className="role-label">I am joining as:</p>
              <div className="roles">
                <button
                  type="button"
                  className={`btn btn-role ${role === "student" ? "active" : ""}`}
                  onClick={() => setRole("student")}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`btn btn-role ${role === "institution" ? "active" : ""}`}
                  onClick={() => setRole("institution")}
                >
                  Institution / Instructor
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
