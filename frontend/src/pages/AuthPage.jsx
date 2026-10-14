import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import logo from "./logo.png";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Button from "../components/ui/Button.jsx";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const notify = useToast();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login({
          email: form.email.trim(),
          password: form.password,
        });

        // Navigate only after login succeeds and AuthContext is updated.
        navigate("/dashboard", { replace: true });
      } else {
        const result = await signup({
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
        });

        notify(
          result.message ||
            "Verification link sent to your email. Verify your email before signing in.",
          "success",
        );

        // Registration does not automatically sign in the user.
        setMode("login");
        setForm((previous) => ({
          ...previous,
          name: "",
          password: "",
        }));
      }
    } catch (err) {
      const message = err.message || "Something went wrong. Please try again.";

      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page text-2xl">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <header className="auth-header">
        <a className="sidebar-brand auth-brand" href="/">
          <img
            src={logo}
            alt="Campusly Logo"
            className="h-12 w-12 object-contain"
          />

          <div>
            <strong>campusly</strong>
            <small>EVENTS & COMMUNITY</small>
          </div>
        </a>
      </header>

      <div className="auth-layout">
        <section className="auth-story">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            THE CAMPUS EXPERIENCE, REIMAGINED
          </div>

          <h1>
            Make campus
            <br />
            life <span>happen.</span>
          </h1>

          <p className="auth-story-copy">
            The place to discover what’s happening, meet your community, and
            make your time on campus count.
          </p>

          <img
            src={logo}
            alt="Campusly Event Registration Portal"
            className="mt-6 h-auto w-56 object-contain"
          />
        </section>

        <section className="auth-card glass-panel">
          <div className="auth-card-glow" />

          <div className="auth-card-content">
            <div className="auth-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in
              </button>

              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
              >
                Create account
              </button>
            </div>

            <div className="auth-title">
              <div className="auth-icon">
                <Sparkles size={20} />
              </div>

              <h2>{mode === "login" ? "Welcome back" : "Join your campus"}</h2>

              <p>
                {mode === "login"
                  ? "Pick up where your campus story left off."
                  : "Create your account and find your next thing."}
              </p>
            </div>

            <form onSubmit={submit} className="auth-form">
              {mode === "signup" && (
                <label className="field">
                  Full name
                  <input
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={update}
                    placeholder="Your full name"
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </label>
              )}

              <label className="field">
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={update}
                  placeholder="you@university.edu"
                  required
                />
              </label>

              <label className="field">
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={form.password}
                  onChange={update}
                  placeholder={
                    mode === "login"
                      ? "Enter your password"
                      : "At least 8 characters"
                  }
                  minLength={mode === "login" ? 1 : 8}
                  required
                />
              </label>

              {mode === "signup" && (
                <label className="field">
                  I’m joining as
                  <select name="role" value={form.role} onChange={update}>
                    <option value="student">Student</option>
                    <option value="organizer">Event organizer</option>
                  </select>
                </label>
              )}

              {error && <p className="form-error">{error}</p>}

              <Button type="submit" loading={loading} className="auth-submit">
                {mode === "login" ? "Sign in to portal" : "Create account"}
                <ArrowRight size={17} />
              </Button>
            </form>

            <div className="auth-security">
              <ShieldCheck size={15} />
              <span>Your account and data are protected</span>
            </div>

            <p className="auth-admin-note">
              Administrator accounts are created through server configuration.
            </p>
          </div>

          <div className="auth-card-bottom">
            <span>
              <Compass size={14} /> Explore. Connect. Create.
            </span>
            <span>v1.0</span>
          </div>
        </section>
      </div>

      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} Campusly</span>
        <span>
          Made for campus life <Sparkles size={13} />
        </span>
      </footer>
    </main>
  );
}
