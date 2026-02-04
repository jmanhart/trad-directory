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
} from "../FormComponents";
import { ModalShell } from "../ModalShell";
import { useToast } from "../Toast";
import { submitReport } from "../../../utils/reportIssue";
import type { ArtistData, ShopData } from "./types";
import styles from "./ReportIssueModal.module.css";
import shellStyles from "../ModalShell/ModalShell.module.css";

export interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: "artist" | "shop";
  entityId?: string;
  pageUrl?: string;
  entityData?: ArtistData | ShopData;
}

function getCurrentValue(
  entityType: "artist" | "shop",
  entityData: ArtistData | ShopData,
  fieldName: string
): string {
  if (entityType === "artist") {
    const artist = entityData as ArtistData;
    switch (fieldName) {
      case "name":
        return artist.name || "";
      case "instagram_handle":
        return artist.instagram_handle || "";
      case "city_name":
        return artist.city_name || "";
      case "state_name":
        return artist.state_name || "";
      case "country_name":
        return artist.country_name || "";
      case "shop_name":
        return artist.shop_name || "";
      case "shop_instagram_handle":
        return artist.shop_instagram_handle || "";
      default:
        return "";
    }
  } else {
    const shop = entityData as ShopData;
    switch (fieldName) {
      case "shop_name":
        return shop.shop_name || "";
      case "instagram_handle":
        return shop.instagram_handle || "";
      case "address":
        return shop.address || "";
      case "city_name":
        return shop.city_name || "";
      case "state_name":
        return shop.state_name || "";
      case "country_name":
        return shop.country_name || "";
      default:
        return "";
    }
  }
}

export default function ReportIssueModal({
  isOpen,
  onClose,
  entityType = "artist",
  entityId = "",
  pageUrl = "",
  entityData,
}: ReportIssueModalProps) {
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [suggestedValues, setSuggestedValues] = useState<
    Record<string, string>
  >({});
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;
  if (!entityData) return null;

  const toggleEdit = (fieldName: string) => {
    const newEditing = new Set(editingFields);
    if (newEditing.has(fieldName)) {
      newEditing.delete(fieldName);
    } else {
      newEditing.add(fieldName);
      const currentValue = getCurrentValue(entityType, entityData, fieldName);
      setSuggestedValues({ ...suggestedValues, [fieldName]: currentValue });
    }
    setEditingFields(newEditing);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setSuggestedValues({ ...suggestedValues, [fieldName]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (editingFields.size === 0) {
        setSubmitError(
          "Please click EDIT on at least one field to report an issue"
        );
        setIsSubmitting(false);
        return;
      }

      const changes: Record<string, { current: string; suggested: string }> =
        {};
      editingFields.forEach(field => {
        changes[field] = {
          current: getCurrentValue(entityType, entityData, field),
          suggested: suggestedValues[field] || "",
        };
      });

      await submitReport({
        submission_type: "report",
        entity_type: entityType,
        entity_id: entityId,
        changes,
        details: details || null,
        reporter_email: email || null,
        page_url: pageUrl || window.location.href,
      });

      setEditingFields(new Set());
      setSuggestedValues({});
      setDetails("");
      setEmail("");
      onClose();
      showToast("Your submission was sent.");
    } catch (error) {
      console.error("Error submitting report:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to submit. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (fieldName: string, label: string) => {
    const currentValue = getCurrentValue(entityType, entityData, fieldName);
    const isEditing = editingFields.has(fieldName);
    const suggestedValue = suggestedValues[fieldName] ?? currentValue;

    return (
      <FormGroup key={fieldName}>
        <div className={styles.fieldRow}>
          <div className={styles.fieldLabel}>
            <Label htmlFor={fieldName}>{label}</Label>
            <span className={styles.currentValue}>
              Current: {currentValue || "N/A"}
            </span>
          </div>
          <div className={styles.fieldControls}>
            {isEditing ? (
              <Input
                id={fieldName}
                value={suggestedValue}
                onChange={e => handleFieldChange(fieldName, e.target.value)}
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
    <ModalShell isOpen={isOpen} onClose={onClose} title="Report an Issue">
      <form onSubmit={handleSubmit} className={shellStyles.modalForm}>
        {submitError && <Message type="error" text={submitError} />}

        <div className={shellStyles.instructions}>
          <p>
            Click <strong>EDIT</strong> next to any field to report an issue and
            suggest a correction.
          </p>
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

        <FormGroup>
          <Label htmlFor="details">Additional Details (Optional)</Label>
          <Textarea
            id="details"
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Please provide any additional information about the changes..."
            rows={4}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="email">Your Email (Optional)</Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
          <p className={shellStyles.helperText}>
            We'll only use this to follow up if we need more information.
          </p>
        </FormGroup>

        <div className={shellStyles.modalFooter}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <SubmitButton loading={isSubmitting} loadingText="Submitting...">
            Submit Report
          </SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}
