import SideNav, {
  SideNavList,
  SideNavItem,
} from "../common/SideNav/SideNav";

interface MapSidebarProps {
  open: boolean;
  onClose: () => void;
  onOpenSuggestModal?: () => void;
}

export default function MapSidebar({
  open,
  onClose,
  onOpenSuggestModal,
}: MapSidebarProps) {
  return (
    <SideNav open={open} onClose={onClose}>
      <SideNavList>
        <SideNavItem
          onClick={() => {
            onOpenSuggestModal?.();
            onClose();
          }}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="10" cy="10" r="8" />
              <line x1="10" y1="6" x2="10" y2="14" />
              <line x1="6" y1="10" x2="14" y2="10" />
            </svg>
          }
        >
          Add an Artist or Shop
        </SideNavItem>
        <SideNavItem
          to="/admin"
          onClick={onClose}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="14" height="14" rx="2" />
              <line x1="3" y1="8" x2="17" y2="8" />
              <line x1="8" y1="8" x2="8" y2="17" />
            </svg>
          }
        >
          Admin
        </SideNavItem>
      </SideNavList>
    </SideNav>
  );
}
