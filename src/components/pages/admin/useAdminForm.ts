/**
 * Custom hook for admin form state management and submission
 */

import { useState } from "react";
import { MessageType } from "./adminTypes";

interface UseAdminFormOptions<TFormData, TSubmitData> {
  initialData: TFormData;
  onSubmit: (data: TSubmitData) => Promise<number | void>;
  transformData: (formData: TFormData) => TSubmitData;
  validateData?: (formData: TFormData) => string | null;
  getSuccessMessage: (formData: TFormData, resultId?: number) => string;
  onSuccess?: () => void;
}

interface UseAdminFormReturn<TFormData> {
  formData: TFormData;
  setFormData: React.Dispatch<React.SetStateAction<TFormData>>;
  loading: boolean;
  message: MessageType;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export function useAdminForm<TFormData extends Record<string, any>, TSubmitData>({
  initialData,
  onSubmit,
  transformData,
  validateData,
  getSuccessMessage,
  onSuccess,
}: UseAdminFormOptions<TFormData, TSubmitData>): UseAdminFormReturn<TFormData> {
  const [formData, setFormData] = useState<TFormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageType>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate if validator provided
      if (validateData) {
        const validationError = validateData(formData);
        if (validationError) {
          setMessage({
            type: "error",
            text: validationError,
          });
          setLoading(false);
          return;
        }
      }

      const submitData = transformData(formData);
      const resultId = await onSubmit(submitData);

      setMessage({
        type: "success",
        text: getSuccessMessage(formData, resultId),
      });

      // Reset form
      resetForm();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialData);
  };

  return {
    formData,
    setFormData,
    loading,
    message,
    handleChange,
    handleSubmit,
    resetForm,
  };
}
