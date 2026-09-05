import { useState, type ReactNode } from "react";
import SearchBar from "./SearchBar";
import SuggestionMenu, { useSuggestionNav } from "./SuggestionMenu";
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
 * The whole search system composed in one view — used by the Search/Overview
 * doc. Not a Storybook story of its own; a living demo the doc renders inline.
 */
export function FullExperience() {
  const [query, setQuery] = useState("");
  const [tableQuery, setTableQuery] = useState("");

  const items = query.trim()
    ? mockSuggestions.filter(s =>
        s.label.toLowerCase().includes(query.toLowerCase())
      )
    : mockSuggestions;
  const { activeIndex, onKeyDown } = useSuggestionNav({
    count: items.length,
    onSelect: i => setQuery(items[i].label),
  });

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
        <div style={{ minHeight: 64 }}>
          <SearchBar
            suggestions={mockSuggestions}
            onSearch={() => {}}
            onSelectSuggestion={() => {}}
          />
        </div>
      </Section>

      <Section
        title="Suggestions menu — SuggestionMenu + SuggestionItem"
        hint="Type to filter, ↑/↓ to move the active row, Enter or click to select."
      >
        <div style={{ maxWidth: 380 }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search…"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="fx-listbox"
            aria-activedescendant={
              activeIndex >= 0 ? `fx-opt-${activeIndex}` : undefined
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 14px",
              border: "3px solid var(--color-border)",
              borderRadius: 9999,
              fontSize: 16,
              marginBottom: 8,
            }}
          />
          <SuggestionMenu
            id="fx-listbox"
            itemIdPrefix="fx-opt"
            items={items}
            activeIndex={activeIndex}
            onSelect={s => setQuery(s.label)}
            emptyLabel="No matches"
          />
        </div>
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
