import React, { useState } from "react";
import {
  FormGroup,
  Label,
  Input,
  Button,
  SubmitButton,
  Message,
} from "../FormComponents";
import { ModalShell } from "../ModalShell";
import { useToast } from "../Toast";
import {
  normalizeInstagramHandle,
  submitNewArtistSuggestion,
} from "../../../utils/reportIssue";
import shellStyles from "../ModalShell/ModalShell.module.css";

export interface SuggestArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestArtistModal(props: SuggestArtistModalProps) {
  const { isOpen, onClose } = props;
  const { showToast } = useToast();
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistInstagram, setNewArtistInstagram] = useState("");
  const [newArtistCity, setNewArtistCity] = useState("");
  const [newArtistCountry, setNewArtistCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (
        !newArtistName ||
        !newArtistInstagram ||
        !newArtistCity ||
        !newArtistCountry
      ) {
        setSubmitError("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      await submitNewArtistSuggestion({
        submission_type: "new_artist",
        artist_name: newArtistName,
        artist_instagram_handle: normalizeInstagramHandle(newArtistInstagram),
        artist_city: newArtistCity,
        artist_country: newArtistCountry,
        details: null,
        reporter_email: null,
        page_url: window.location.href,
      });

      setNewArtistName("");
      setNewArtistInstagram("");
      setNewArtistCity("");
      setNewArtistCountry("");
      onClose();
      showToast("Your submission was sent.");
    } catch (error) {
      console.error("Error submitting artist suggestion:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to submit. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} hideHeader>
      <form onSubmit={handleSubmit} className={shellStyles.modalForm}>
        {submitError && <Message type="error" text={submitError} />}

        <FormGroup>
          <Label htmlFor="new_artist_name" required>
            Name
          </Label>
          <Input
            id="new_artist_name"
            value={newArtistName}
            onChange={e => setNewArtistName(e.target.value)}
            placeholder="Artist name"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="new_artist_instagram" required>
            Instagram Proflie
          </Label>
          <Input
            id="new_artist_instagram"
            value={newArtistInstagram}
            onChange={e => setNewArtistInstagram(e.target.value)}
            placeholder="@username or https://instagram.com/username"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="new_artist_city" required>
            City
          </Label>
          <Input
            id="new_artist_city"
            value={newArtistCity}
            onChange={e => setNewArtistCity(e.target.value)}
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
            onChange={e => setNewArtistCountry(e.target.value)}
            placeholder="Country name"
            required
          />
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
            Submit Artist
          </SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}
