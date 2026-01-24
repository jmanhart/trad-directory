import React from "react";
import styles from "./AdminForm.module.css";

interface FormGroupProps {
  children: React.ReactNode;
}

export function FormGroup({ children }: FormGroupProps) {
  return <div className={styles.formGroup}>{children}</div>;
}

interface LabelProps {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Label({ htmlFor, required, children }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={styles.label}>
      {children} {required && <span className={styles.required}>*</span>}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // All standard input props are inherited
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={`${styles.input} ${className || ""}`} {...props} />;
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={`${styles.select} ${className || ""}`} {...props}>
      {children}
    </select>
  );
}

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function SubmitButton({ loading, loadingText, children, ...props }: SubmitButtonProps) {
  return (
    <button type="submit" className={styles.submitButton} disabled={loading || props.disabled} {...props}>
      {loading ? loadingText || "Loading..." : children}
    </button>
  );
}

interface MessageProps {
  type: "success" | "error";
  text: string;
}

export function Message({ type, text }: MessageProps) {
  return (
    <div className={`${styles.message} ${styles[type]}`}>
      {text}
    </div>
  );
}

interface MessageWithRetryProps extends MessageProps {
  onRetry?: () => void;
  retryLoading?: boolean;
}

export function MessageWithRetry({
  type,
  text,
  onRetry,
  retryLoading = false,
}: MessageWithRetryProps) {
  return (
    <div className={`${styles.message} ${styles[type]}`}>
      <span>{text}</span>
      {type === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retryLoading}
          style={{
            marginLeft: "1rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            background: "transparent",
            border: "1px solid currentColor",
            borderRadius: "4px",
            cursor: retryLoading ? "not-allowed" : "pointer",
            opacity: retryLoading ? 0.6 : 1,
          }}
        >
          {retryLoading ? "Retrying..." : "Retry"}
        </button>
      )}
    </div>
  );
}
