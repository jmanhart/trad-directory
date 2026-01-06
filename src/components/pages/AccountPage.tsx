import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";
import RequireAuth from "../auth/RequireAuth";
import styles from "./AccountPage.module.css";

function AccountPageContent() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile, updateEmail } = useProfile();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || user?.email || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile, user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update email if changed
      if (email !== user?.email) {
        const { error: emailError } = await updateEmail(email);
        if (emailError) {
          setError(`Email update failed: ${emailError.message}`);
          setSaving(false);
          return;
        }
        // Note: Supabase will send verification email for new email
        setSuccess(true);
      }

      // Update profile
      const { error: profileError } = await updateProfile({
        name: name || null,
        avatar_url: avatarUrl || null,
      });

      if (profileError) {
        setError(`Update failed: ${profileError.message}`);
      } else {
        setSuccess(true);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(profile?.name || "");
    setEmail(profile?.email || user?.email || "");
    setAvatarUrl(profile?.avatar_url || "");
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  if (profileLoading) {
    return (
      <div className={styles.container}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Account</h1>
      <div className={styles.card}>
        {isEditing ? (
          <>
            <div className={styles.section}>
              <h2>Name</h2>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="Your name"
              />
            </div>

            <div className={styles.section}>
              <h2>Email</h2>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="your@email.com"
              />
              <p className={styles.helpText}>
                Changing email will require verification
              </p>
            </div>

            <div className={styles.section}>
              <h2>Avatar URL</h2>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className={styles.input}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {success && (
              <p className={styles.success}>
                Profile updated! {email !== user?.email && "Check your email to verify the new address."}
              </p>
            )}

            <div className={styles.actions}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={styles.button}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className={styles.buttonSecondary}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.section}>
              <h2>Profile</h2>
              {profile?.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className={styles.avatar}
                />
              )}
              <p className={styles.value}>
                <strong>Name:</strong> {profile?.name || "Not set"}
              </p>
              <p className={styles.value}>
                <strong>Email:</strong> {profile?.email || user?.email}
              </p>
            </div>

            <div className={styles.section}>
              <h2>Actions</h2>
              <div className={styles.actions}>
                <button
                  onClick={() => setIsEditing(true)}
                  className={styles.button}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate("/saved")}
                  className={styles.button}
                >
                  View Saved Artists
                </button>
                <button
                  onClick={handleSignOut}
                  className={styles.buttonDanger}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountPageContent />
    </RequireAuth>
  );
}

