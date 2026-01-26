import React from "react";
import styles from "./FormComponents.module.css";

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className }: FormGroupProps) {
  return <div className={`${styles.formGroup} ${className || ""}`}>{children}</div>;
}

interface LabelProps {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Label({ htmlFor, required, children, className }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`${styles.label} ${className || ""}`}>
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

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // All standard textarea props are inherited
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={`${styles.textarea} ${className || ""}`} {...props} />;
  }
);
Textarea.displayName = "Textarea";

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

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function Button({ 
  variant = "primary", 
  loading, 
  loadingText, 
  children, 
  className,
  ...props 
}: ButtonProps) {
  const variantClass = styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
  return (
    <button 
      className={`${styles.button} ${variantClass} ${className || ""}`} 
      disabled={loading || props.disabled} 
      {...props}
    >
      {loading ? loadingText || "Loading..." : children}
    </button>
  );
}

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function SubmitButton({ loading, loadingText, children, className, ...props }: SubmitButtonProps) {
  return (
    <button 
      type="submit" 
      className={`${styles.submitButton} ${className || ""}`} 
      disabled={loading || props.disabled} 
      {...props}
    >
      {loading ? loadingText || "Loading..." : children}
    </button>
  );
}

interface MessageProps {
  type: "success" | "error" | "info";
  text: string;
  className?: string;
}

export function Message({ type, text, className }: MessageProps) {
  return (
    <div className={`${styles.message} ${styles[type]} ${className || ""}`}>
      {text}
    </div>
  );
}

interface HelperTextProps {
  children: React.ReactNode;
  className?: string;
}

export function HelperText({ children, className }: HelperTextProps) {
  return (
    <p className={`${styles.helperText} ${className || ""}`}>
      {children}
    </p>
  );
}
