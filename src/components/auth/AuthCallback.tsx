import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Get the original destination from session storage (set in LoginPage)
      const from = sessionStorage.getItem("auth_redirect") || "/";
      sessionStorage.removeItem("auth_redirect");
      navigate(from, { replace: true });
    }
  }, [user, navigate]);

  // Check for error in URL
  const error = searchParams.get("error");
  const wrap = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "0.75rem",
    textAlign: "center" as const,
  };
  if (error) {
    return (
      <div style={wrap}>
        <h2 style={{ color: "var(--color-text-primary)", margin: 0 }}>
          Authentication Error
        </h2>
        <p style={{ color: "var(--color-text-tertiary)" }}>{error}</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <p style={{ color: "var(--color-text-tertiary)" }}>Completing sign in…</p>
    </div>
  );
}
