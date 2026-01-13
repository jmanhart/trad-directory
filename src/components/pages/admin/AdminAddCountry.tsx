import { useState } from "react";
import { addCountry } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import { FormGroup, Label, Input, SubmitButton, Message } from "./AdminFormComponents";
import styles from "./AdminForm.module.css";

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
    <AdminFormLayout title="Add Country">
      <form onSubmit={handleSubmit} className={styles.form}>
        <FormGroup>
          <Label htmlFor="country_name" required>
            Country Name
          </Label>
          <Input
            type="text"
            id="country_name"
            name="country_name"
            value={formData.country_name}
            onChange={handleChange}
            required
            placeholder="Country name"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="country_code">Country Code</Label>
          <Input
            type="text"
            id="country_code"
            name="country_code"
            value={formData.country_code}
            onChange={handleChange}
            placeholder="e.g., US, CA, GB"
            maxLength={3}
          />
        </FormGroup>

        {message && <Message type={message.type} text={message.text} />}

        <SubmitButton loading={loading} loadingText="Adding...">
          Add Country
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}

