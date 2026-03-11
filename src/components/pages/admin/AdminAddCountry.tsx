import { addCountry } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import {
  FormGroup,
  Label,
  Input,
  Select,
  SubmitButton,
  Message,
} from "./AdminFormComponents";
import { useAdminForm } from "./useAdminForm";
import styles from "./AdminForm.module.css";

const CONTINENT_OPTIONS = [
  "North America",
  "Central America",
  "South America",
  "Europe",
  "Asia",
  "Oceania",
  "Africa",
];

interface CountryFormData {
  country_name: string;
  country_code: string;
  continent: string;
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
      continent: "",
    },
    onSubmit: async data => {
      return await addCountry(data);
    },
    transformData: formData => ({
      country_name: formData.country_name,
      country_code: formData.country_code || undefined,
      continent: formData.continent || undefined,
    }),
    validateData: formData => {
      if (!formData.country_name) {
        return "Please enter a country name";
      }
      return null;
    },
    getSuccessMessage: (formData, countryId) =>
      `Country "${formData.country_name}" added successfully! (ID: ${countryId})`,
    autoDismissSuccess: true,
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

        <FormGroup>
          <Label htmlFor="continent">Continent</Label>
          <Select
            id="continent"
            name="continent"
            value={formData.continent}
            onChange={handleChange}
          >
            <option value="">Select continent</option>
            {CONTINENT_OPTIONS.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FormGroup>

        <SubmitButton loading={loading} loadingText="Adding...">
          Add Country
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}

