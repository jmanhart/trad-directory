import React, { useState } from "react";
import {
  FormGroup,
  Label,
  Select,
  Textarea,
  Input,
  Button,
  SubmitButton,
  Message,
} from "./FormComponents";
import styles from "./ReportIssueModal.module.css";

interface ArtistData {
  id: number;
  name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  shop_name?: string | null;
  shop_instagram_handle?: string | null;
}

interface ShopData {
  id: number;
  shop_name: string;
  instagram_handle?: string | null;
  address?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "report" | "new_artist";
  entityType?: "artist" | "shop";
  entityId?: string;
  pageUrl?: string;
  entityData?: ArtistData | ShopData;
}

export default function ReportIssueModal({
  isOpen,
  onClose,
  mode = "report",
  entityType = "artist",
  entityId = "",
  pageUrl = "",
  entityData,
}: ReportIssueModalProps) {
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [suggestedValues, setSuggestedValues] = useState<Record<string, string>>({});
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // For new artist mode
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistInstagram, setNewArtistInstagram] = useState("");
  const [newArtistCity, setNewArtistCity] = useState("");
  const [newArtistCountry, setNewArtistCountry] = useState("");

  if (!isOpen) return null;
  if (mode === "report" && !entityData) return null;

  const toggleEdit = (fieldName: string) => {
    const newEditing = new Set(editingFields);
    if (newEditing.has(fieldName)) {
      newEditing.delete(fieldName);
    } else {
      newEditing.add(fieldName);
      // Initialize suggested value with current value
      const currentValue = getCurrentValue(fieldName);
      setSuggestedValues({ ...suggestedValues, [fieldName]: currentValue });
    }
    setEditingFields(newEditing);
  };

  const getCurrentValue = (fieldName: string): string => {
    if (entityType === "artist") {
      const artist = entityData as ArtistData;
      switch (fieldName) {
        case "name": return artist.name || "";
        case "instagram_handle": return artist.instagram_handle || "";
        case "city_name": return artist.city_name || "";
        case "state_name": return artist.state_name || "";
        case "country_name": return artist.country_name || "";
        case "shop_name": return artist.shop_name || "";
        case "shop_instagram_handle": return artist.shop_instagram_handle || "";
        default: return "";
      }
    } else {
      const shop = entityData as ShopData;
      switch (fieldName) {
        case "shop_name": return shop.shop_name || "";
        case "instagram_handle": return shop.instagram_handle || "";
        case "address": return shop.address || "";
        case "city_name": return shop.city_name || "";
        case "state_name": return shop.state_name || "";
        case "country_name": return shop.country_name || "";
        default: return "";
      }
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setSuggestedValues({ ...suggestedValues, [fieldName]: value });
  };

  // Extract Instagram handle from URL or use as-is
  const normalizeInstagramHandle = (input: string): string => {
    if (!input) return "";
    // Remove common URL patterns
    const cleaned = input
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
      .replace(/^@/, "")
      .trim();
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      let payload: any;

      if (mode === "new_artist") {
        // Validate required fields
        if (!newArtistName || !newArtistInstagram || !newArtistCity || !newArtistCountry) {
          setSubmitError("Please fill in all required fields");
          setIsSubmitting(false);
          return;
        }

        payload = {
          submission_type: "new_artist",
          artist_name: newArtistName,
          artist_instagram_handle: normalizeInstagramHandle(newArtistInstagram),
          artist_city: newArtistCity,
          artist_country: newArtistCountry,
          details: details || null,
          reporter_email: email || null,
          page_url: window.location.href,
        };
      } else {
        // Report mode - validate that at least one field is being edited
        if (editingFields.size === 0) {
          setSubmitError("Please click EDIT on at least one field to report an issue");
          setIsSubmitting(false);
          return;
        }

        const changes: Record<string, { current: string; suggested: string }> = {};
        editingFields.forEach((field) => {
          changes[field] = {
            current: getCurrentValue(field),
            suggested: suggestedValues[field] || "",
          };
        });

        payload = {
          submission_type: "report",
          entity_type: entityType,
          entity_id: entityId,
          changes,
          details: details || null,
          reporter_email: email || null,
          page_url: pageUrl || window.location.href,
        };
      }

      // Call API
      const apiUrl = import.meta.env.VITE_API_URL || "/api/submitReport";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      setSubmitSuccess(true);

      // Reset form after success
      setTimeout(() => {
        if (mode === "new_artist") {
          setNewArtistName("");
          setNewArtistInstagram("");
          setNewArtistCity("");
          setNewArtistCountry("");
        } else {
          setEditingFields(new Set());
          setSuggestedValues({});
        }
        setDetails("");
        setEmail("");
        setSubmitSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error submitting:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (fieldName: string, label: string) => {
    const currentValue = getCurrentValue(fieldName);
    const isEditing = editingFields.has(fieldName);
    const suggestedValue = suggestedValues[fieldName] || currentValue;

    return (
      <FormGroup key={fieldName}>
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabel}>
            <Label htmlFor={fieldName}>{label}</Label>
            <span className={styles.currentValue}>Current: {currentValue || "N/A"}</span>
          </div>
          <div className={styles.fieldControls}>
            {isEditing ? (
              <Input
                id={fieldName}
                value={suggestedValue}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={`Enter new ${label.toLowerCase()}...`}
              />
            ) : (
              <Select id={fieldName} value={currentValue} disabled>
                <option>{currentValue || "N/A"}</option>
              </Select>
            )}
            <Button
              type="button"
              variant={isEditing ? "primary" : "outline"}
              onClick={() => toggleEdit(fieldName)}
              className={styles.editButton}
            >
              {isEditing ? "CANCEL" : "EDIT"}
            </Button>
          </div>
        </div>
      </FormGroup>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === "new_artist" ? "Add New Artist" : "Report an Issue"}
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalContent}>
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            {submitSuccess && (
              <Message type="success" text="Submission received! Thank you for your feedback." />
            )}
            {submitError && (
              <Message type="error" text={submitError} />
            )}

            {mode === "new_artist" ? (
              <>
                <div className={styles.instructions}>
                  <p>Fill in the required information to submit a new artist for review.</p>
                </div>

                <FormGroup>
                  <Label htmlFor="new_artist_name" required>
                    Name
                  </Label>
                  <Input
                    id="new_artist_name"
                    value={newArtistName}
                    onChange={(e) => setNewArtistName(e.target.value)}
                    placeholder="Artist name"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="new_artist_instagram" required>
                    Instagram Handle
                  </Label>
                  <Input
                    id="new_artist_instagram"
                    value={newArtistInstagram}
                    onChange={(e) => setNewArtistInstagram(e.target.value)}
                    placeholder="@username or https://instagram.com/username"
                    required
                  />
                  <p className={styles.helperText}>
                    You can paste the full Instagram URL or just the username
                  </p>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="new_artist_city" required>
                    City
                  </Label>
                  <Input
                    id="new_artist_city"
                    value={newArtistCity}
                    onChange={(e) => setNewArtistCity(e.target.value)}
                    placeholder="City name"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="new_artist_country" required>
                    Country
                  </Label>
                  <Input
                    id="new_artist_country"
                    value={newArtistCountry}
                    onChange={(e) => setNewArtistCountry(e.target.value)}
                    placeholder="Country name"
                    required
                  />
                </FormGroup>
              </>
            ) : (
              <>
                <div className={styles.instructions}>
                  <p>Click <strong>EDIT</strong> next to any field to report an issue and suggest a correction.</p>
                </div>

                {entityType === "artist" ? (
                  <>
                    {renderField("name", "Name")}
                    {renderField("instagram_handle", "Instagram Handle")}
                    {renderField("city_name", "City")}
                    {renderField("state_name", "State")}
                    {renderField("country_name", "Country")}
                    {renderField("shop_name", "Shop Name")}
                    {renderField("shop_instagram_handle", "Shop Instagram Handle")}
                  </>
                ) : (
                  <>
                    {renderField("shop_name", "Shop Name")}
                    {renderField("instagram_handle", "Instagram Handle")}
                    {renderField("address", "Address")}
                    {renderField("city_name", "City")}
                    {renderField("state_name", "State")}
                    {renderField("country_name", "Country")}
                  </>
                )}
              </>
            )}

            <FormGroup>
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  mode === "new_artist"
                    ? "Any additional information about this artist..."
                    : "Please provide any additional information about the changes..."
                }
                rows={4}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Your Email (Optional)</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <p className={styles.helperText}>
                We'll only use this to follow up if we need more information.
              </p>
            </FormGroup>

            {/* Cloudflare Turnstile widget placeholder */}
            <FormGroup>
              <div className={styles.turnstileContainer}>
                <div className={styles.turnstilePlaceholder}>
                  [Cloudflare Turnstile Widget]
                </div>
              </div>
            </FormGroup>

            {/* Hidden fields */}
            <input type="hidden" name="entity_type" value={entityType} />
            <input type="hidden" name="entity_id" value={entityId} />
            <input type="hidden" name="page_url" value={pageUrl} />

            <div className={styles.modalFooter}>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <SubmitButton loading={isSubmitting} loadingText="Submitting...">
                {mode === "new_artist" ? "Submit Artist" : "Submit Report"}
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
