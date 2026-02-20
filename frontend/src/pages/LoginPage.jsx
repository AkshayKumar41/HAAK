import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState("student");
  const [identity, setIdentity] = useState("");

  useEffect(() => {
    const roleParam = (searchParams.get("role") || "").toLowerCase();
    if (roleParam === "teacher") {
      setRole("teacher");
      return;
    }
    if (roleParam === "student") {
      setRole("student");
    }
  }, [searchParams]);

  function handleSubmit(e) {
    e.preventDefault();
    localStorage.setItem("IntuMotion_role", role);
    localStorage.setItem("IntuMotion_identity", identity.trim());
    if (role === "teacher") {
      navigate("/teacher");
      return;
    }
    navigate("/student");
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
        </nav>
      </header>

      <main className="login-main">
        <section className="auth reveal">
          <div className="auth-card">
            <div className="auth-head">
              <h2>Login / Sign Up</h2>
              <p>Choose your identity and role to personalize your learning journey.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="identity">Email or Username</label>
              <input
                id="identity"
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="name@school.edu or username"
              />

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
                  <span className="social-content">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="social-icon">
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.95h5.49c-.24 1.27-.96 2.34-2.04 3.06l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.47 0-.72-.07-1.41-.19-2.1H12z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 22c2.76 0 5.07-.91 6.76-2.46l-3.3-2.56c-.91.61-2.07.97-3.46.97-2.65 0-4.9-1.79-5.7-4.2l-3.41 2.63C4.57 19.7 8.02 22 12 22z"
                      />
                      <path
                        fill="#4A90E2"
                        d="M6.3 13.75A5.98 5.98 0 0 1 6 12c0-.61.1-1.2.3-1.75L2.89 7.62A9.9 9.9 0 0 0 2 12c0 1.57.38 3.05 1.05 4.38l3.25-2.63z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.06 2.99 14.75 2 12 2 8.02 2 4.57 4.3 3.05 7.62l3.25 2.63c.8-2.41 3.05-4.2 5.7-4.2z"
                      />
                    </svg>
                    Continue with Google
                  </span>
                </button>
                <button type="button" className="btn btn-social">
                  <span className="social-content">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="social-icon">
                      <path
                        fill="currentColor"
                        d="M16.78 12.24c.02 2.35 2.06 3.13 2.09 3.14-.02.05-.33 1.17-1.09 2.33-.67 1-1.36 1.99-2.46 2.01-1.08.02-1.43-.64-2.67-.64-1.24 0-1.62.62-2.64.66-1.05.04-1.85-1.06-2.53-2.05-1.39-2-2.45-5.65-1.03-8.15.7-1.24 1.96-2.02 3.33-2.04 1.03-.02 2 .69 2.67.69.67 0 1.93-.85 3.25-.73.55.02 2.1.22 3.1 1.68-.08.05-1.85 1.08-1.83 3.1zm-2.18-6.1c.56-.68.94-1.62.84-2.56-.82.03-1.8.55-2.39 1.23-.52.59-.98 1.55-.85 2.46.92.07 1.85-.47 2.4-1.13z"
                      />
                    </svg>
                    Continue with Apple
                  </span>
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
                  className={`btn btn-role ${role === "teacher" ? "active" : ""}`}
                  onClick={() => setRole("teacher")}
                >
                  Teacher / Instructor
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
