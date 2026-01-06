import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to saved page or original destination
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || "/saved";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Save redirect destination
  useEffect(() => {
    const from = (location.state as any)?.from?.pathname;
    if (from) {
      sessionStorage.setItem("auth_redirect", from);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Sign In</h1>
        <p className={styles.subtitle}>
          Enter your email to receive a magic link
        </p>

        {success ? (
          <div className={styles.success}>
            <p>✅ Check your email!</p>
            <p className={styles.successText}>
              We've sent you a magic link. Click it to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !email}
              className={styles.button}
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

