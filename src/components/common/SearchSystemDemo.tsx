import { useState, type ReactNode } from "react";
import SearchBar from "./SearchBar";
import TableSearch from "./TableSearch";
import { mockSuggestions } from "./__fixtures__/suggestions.mock";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <h4 style={{ margin: 0, color: "var(--color-primary)" }}>{title}</h4>
      <p style={{ margin: "0 0 0.5rem", color: "var(--color-text-secondary)" }}>
        {hint}
      </p>
      {children}
    </section>
  );
}

/**
 * The search system composed in one view — used by the Search/Overview doc.
 * Not a Storybook story of its own; a living demo the doc renders inline.
 * One public SearchBar (type to open its menu) plus the admin TableSearch.
 */
export function FullExperience() {
  const [tableQuery, setTableQuery] = useState("");

  return (
    <div
      style={{
        maxWidth: 780,
        display: "flex",
        flexDirection: "column",
        gap: "2.5rem",
      }}
    >
      <Section
        title="Public search — SearchBar"
        hint="The real site component; type to open its grouped suggestions."
      >
        <SearchBar
          suggestions={mockSuggestions}
          onSearch={() => {}}
          onSelectSuggestion={() => {}}
        />
      </Section>

      <Section
        title="Admin table search — TableSearch"
        hint="Filters dense admin data tables."
      >
        <TableSearch
          variant="full"
          value={tableQuery}
          onChange={setTableQuery}
          placeholder="Search artists…"
        />
      </Section>
    </div>
  );
}
