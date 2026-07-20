import { useState } from "react";
import { Outlet } from "react-router-dom";
import ProtectedRoute from "../../common/ProtectedRoute";
import { AdminDataProvider } from "./AdminDataProvider";
import AdminSidebar from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <AdminDataProvider>
        <div className={styles.topbar}>
          <button
            className={styles.hamburgerButton}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open admin menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <Outlet />
      </AdminDataProvider>
    </ProtectedRoute>
  );
}
