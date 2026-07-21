import { Outlet } from "react-router-dom";
import ProtectedRoute from "../../common/ProtectedRoute";
import useIsMobile from "../../../hooks/useIsMobile";
import { AdminDataProvider } from "./AdminDataProvider";
import { useAdminUi } from "./AdminUiContext";
import AdminSidebar from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  return (
    <ProtectedRoute>
      <AdminDataProvider>
        <AdminLayoutInner />
      </AdminDataProvider>
    </ProtectedRoute>
  );
}

function AdminLayoutInner() {
  const isMobile = useIsMobile();
  const { sidebarOpen, setSidebarOpen } = useAdminUi();

  return (
    <div className={styles.shell}>
      <AdminSidebar
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
