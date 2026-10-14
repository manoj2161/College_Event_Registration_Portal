import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, CircleAlert, MailCheck } from "lucide-react";
import { apiRequest } from "../services/api.js";
import Button from "../components/ui/Button.jsx";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    let active = true;
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("This verification link is incomplete.");
      return () => {
        active = false;
      };
    }
    apiRequest("/auth/verify-email", { method: "POST", body: { token } })
      .then((data) => {
        if (!active) return;
        setStatus("success");
        setMessage(
          data.message || "Your email has been verified successfully.",
        );
      })
      .catch((error) => {
        if (!active) return;
        setStatus("error");
        setMessage(
          error.message || "This verification link is invalid or expired.",
        );
      });
    return () => {
      active = false;
    };
  }, [params]);

  return (
    <main className="verify-page">
      <section className="verify-card glass-panel">
        <div className={`verify-icon ${status}`}>
          {status === "success" ? (
            <CheckCircle2 size={28} />
          ) : status === "error" ? (
            <CircleAlert size={28} />
          ) : (
            <MailCheck size={28} />
          )}
        </div>
        <p className="eyebrow">CAMPUSLY ACCOUNT</p>
        <h1>
          {status === "success"
            ? "Email verified"
            : status === "error"
              ? "Verification failed"
              : "Verifying email"}
        </h1>
        <p className="verify-copy">{message}</p>
        {status !== "loading" && (
          <Link to="/">
            <Button>
              {status === "success"
                ? "Continue to Campusly"
                : "Back to sign in"}
            </Button>
          </Link>
        )}
      </section>
    </main>
  );
}
