import { addCountry } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import { FormGroup, Label, Input, SubmitButton, Message } from "./AdminFormComponents";
import { useAdminForm } from "./useAdminForm";
import styles from "./AdminForm.module.css";

interface CountryFormData {
  country_name: string;
  country_code: string;
}

export default function AdminAddCountry() {
  const {
    formData,
    loading,
    message,
    handleChange,
    handleSubmit,
  } = useAdminForm<CountryFormData, any>({
    initialData: {
      country_name: "",
      country_code: "",
    },
    onSubmit: async (data) => {
      return await addCountry(data);
    },
    transformData: (formData) => ({
      country_name: formData.country_name,
      country_code: formData.country_code || undefined,
    }),
    validateData: (formData) => {
      if (!formData.country_name) {
        return "Please enter a country name";
      }
      return null;
    },
    getSuccessMessage: (formData, countryId) =>
      `Country "${formData.country_name}" added successfully! (ID: ${countryId})`,
  });

  return (
    <AdminFormLayout title="Add Country">
      <form onSubmit={handleSubmit} className={styles.form}>
        {message && <Message type={message.type} text={message.text} />}
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

        <SubmitButton loading={loading} loadingText="Adding...">
          Add Country
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}

