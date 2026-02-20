import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function parseIdentity(identity) {
  const value = identity.trim();
  if (!value) return { name: "", email: "" };
  if (value.includes("@")) {
    const [left] = value.split("@");
    return { name: left || "", email: value };
  }
  return { name: value, email: "" };
}

export default function TeacherProfilePage() {
  const navigate = useNavigate();
  const initial = useMemo(() => {
    const storedName = localStorage.getItem("IntuMotion_profile_name") || "";
    const storedEmail = localStorage.getItem("IntuMotion_profile_email") || "";
    const loginIdentity = localStorage.getItem("IntuMotion_identity") || "";
    const parsed = parseIdentity(loginIdentity);

    return {
      name: storedName || parsed.name || "Teacher",
      email: storedEmail || parsed.email || "",
      institution: localStorage.getItem("IntuMotion_profile_institution") || "",
    };
  }, []);

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [institution, setInstitution] = useState(initial.institution);
  const [saved, setSaved] = useState(false);

  function saveProfile(e) {
    e.preventDefault();
    localStorage.setItem("IntuMotion_profile_name", name.trim());
    localStorage.setItem("IntuMotion_profile_email", email.trim());
    localStorage.setItem("IntuMotion_profile_institution", institution.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  function logout() {
    localStorage.removeItem("IntuMotion_role");
    navigate("/login");
  }

  return (
    <div className="shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-grid" />

      <header className="site-header reveal">
        <Link className="brand" to="/teacher">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">IntuMotion</span>
        </Link>
        <nav>
          <Link to="/teacher" className="nav-cta">
            Back to Portal
          </Link>
        </nav>
      </header>

      <main className="login-main">
        <section className="auth reveal">
          <div className="auth-card">
            <div className="auth-head">
              <h2>My Profile</h2>
              <p>Update your teacher account details.</p>
            </div>

            <form className="auth-form" onSubmit={saveProfile}>
              <label htmlFor="profile-name">Edit Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Teacher name"
              />

              <label htmlFor="profile-email">Edit Email</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.edu"
              />

              <label htmlFor="profile-institution">Edit Institution</label>
              <input
                id="profile-institution"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Institution"
              />

              <div className="portal-actions">
                <button type="submit" className="btn btn-primary">
                  Save Profile
                </button>
                <button type="button" className="btn btn-danger" onClick={logout}>
                  Log Out
                </button>
              </div>

              {saved && <p className="success">Profile saved.</p>}
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
