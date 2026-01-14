import { Link } from "react-router-dom";
import styles from "./AdminForm.module.css";

interface AdminFormLayoutProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}

export default function AdminFormLayout({ title, children, loading }: AdminFormLayoutProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/admin" className={styles.backLink}>← Back to Admin</Link>
      <h1 className={styles.title}>{title}</h1>
      {children}
    </div>
  );
}
