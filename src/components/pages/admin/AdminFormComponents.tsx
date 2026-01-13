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

export function Input({ className, ...props }: InputProps) {
  return <input className={`${styles.input} ${className || ""}`} {...props} />;
}

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
