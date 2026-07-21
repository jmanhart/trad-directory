import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";

interface AdminUiContextValue {
  /**
   * On desktop: true = expanded sidebar, false = collapsed icon rail.
   * On mobile: true = overlay open, false = overlay closed.
   */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const AdminUiContext = createContext<AdminUiContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminUi() {
  const ctx = useContext(AdminUiContext);
  if (!ctx) {
    throw new Error("useAdminUi must be used within an AdminUiProvider");
  }
  return ctx;
}

export function AdminUiProvider({ children }: { children: ReactNode }) {
  // Default open on desktop, closed on mobile. Read once (no resize
  // subscription here, so we don't re-render the whole app on resize).
  const [sidebarOpen, setSidebarOpen] = useState(
    () => !window.matchMedia("(max-width: 767px)").matches
  );
  const toggleSidebar = useCallback(() => setSidebarOpen(o => !o), []);

  return (
    <AdminUiContext.Provider
      value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}
    >
      {children}
    </AdminUiContext.Provider>
  );
}
