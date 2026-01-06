import { useState } from "react";
import { Link } from "react-router-dom";
import { addCountry } from "../../services/adminApi";
import styles from "./AdminAddCountry.module.css";

export default function AdminAddCountry() {
  const [formData, setFormData] = useState({
    country_name: "",
    country_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate required fields
      if (!formData.country_name) {
        setMessage({
          type: "error",
          text: "Please enter a country name",
        });
        setLoading(false);
        return;
      }

      const countryData = {
        country_name: formData.country_name,
        country_code: formData.country_code || undefined,
      };

      const countryId = await addCountry(countryData);
      setMessage({
        type: "success",
        text: `Country "${formData.country_name}" added successfully! (ID: ${countryId})`,
      });

      // Reset form
      setFormData({
        country_name: "",
        country_code: "",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to add country",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/admin" className={styles.backLink}>← Back to Admin</Link>
      <h1 className={styles.title}>Add Country</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="country_name" className={styles.label}>
            Country Name <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="country_name"
            name="country_name"
            value={formData.country_name}
            onChange={handleChange}
            className={styles.input}
            required
            placeholder="Country name"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="country_code" className={styles.label}>
            Country Code
          </label>
          <input
            type="text"
            id="country_code"
            name="country_code"
            value={formData.country_code}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g., US, CA, GB"
            maxLength={3}
          />
        </div>

        {message && (
          <div
            className={`${styles.message} ${
              message.type === "success" ? styles.success : styles.error
            }`}
          >
            {message.text}
          </div>
        )}

        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? "Adding..." : "Add Country"}
        </button>
      </form>
    </div>
  );
}

