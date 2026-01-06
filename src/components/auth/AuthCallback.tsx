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
  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Completing sign in...</p>
    </div>
  );
}

