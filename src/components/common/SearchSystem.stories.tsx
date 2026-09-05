import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import SearchBar from "./SearchBar";
import SuggestionMenu, { useSuggestionNav } from "./SuggestionMenu";
import TableSearch from "./TableSearch";
import { mockSuggestions } from "./__fixtures__/suggestions.mock";

const meta = {
  title: "Search/Full Experience",
  // Composed showcase, not a single-component API — skip the autodocs page.
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The whole search system in one view: the public SearchBar, the open SuggestionMenu (SuggestionItem rows), and the admin TableSearch. A living smoke test that every piece renders and behaves together.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = fn();

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
      <h3 style={{ margin: 0, color: "var(--color-primary)" }}>{title}</h3>
      <p style={{ margin: "0 0 0.5rem", color: "var(--color-text-secondary)" }}>
        {hint}
      </p>
      {children}
    </section>
  );
}

function FullExperience() {
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
        padding: "2rem",
        maxWidth: 780,
        display: "flex",
        flexDirection: "column",
        gap: "2.75rem",
      }}
    >
      <Section
        title="Public search — SearchBar"
        hint="The real site component; type to open its grouped suggestions."
      >
        <div style={{ minHeight: 64 }}>
          <SearchBar
            suggestions={mockSuggestions}
            onSearch={noop}
            onSelectSuggestion={noop}
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

/** The full search system, composed — every component together in one view. */
export const Default: Story = {
  render: () => <FullExperience />,
};
