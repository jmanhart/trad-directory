import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn, within, userEvent } from "@storybook/test";
import SuggestionMenu, { useSuggestionNav } from "./SuggestionMenu";
import { mockSuggestions } from "./__fixtures__/suggestions.mock";
import type { Suggestion } from "../../utils/suggestions";

const longList: Suggestion[] = Array.from({ length: 24 }, (_, i) => {
  const base = mockSuggestions[i % mockSuggestions.length];
  return { ...base, label: `${base.label} ${i + 1}`, id: 1000 + i };
});

const meta = {
  title: "Search/SuggestionMenu",
  component: SuggestionMenu,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The accessible suggestions dropdown — a role=listbox of SuggestionItems. Presentational: the parent owns activeIndex and key handling via the exported useSuggestionNav hook (ArrowDown/Up wrap, Enter selects, Escape closes).",
      },
    },
  },
  args: { onSelect: fn() },
  decorators: [
    Story => (
      <div style={{ maxWidth: 380 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SuggestionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The full suggested list, open. Click a row (or it starts on one) to make it
 *  the active row. */
export const Open: Story = {
  render: args => {
    const [activeIndex, setActiveIndex] = useState(2);
    return (
      <SuggestionMenu
        {...args}
        items={mockSuggestions}
        activeIndex={activeIndex}
        onSelect={(suggestion, index) => {
          setActiveIndex(index);
          args.onSelect(suggestion, index);
        }}
      />
    );
  },
};

/** No matches — renders the empty message when `emptyLabel` is provided. */
export const Empty: Story = {
  args: { items: [], emptyLabel: "No matches" },
};

/** Overflows its max-height and scrolls. */
export const LongList: Story = {
  args: { items: longList, activeIndex: 0 },
};

/**
 * Live combobox: type to filter, then Arrow ↑/↓ to move the active row and
 * Enter to select. Demonstrates `useSuggestionNav` wiring an input to the menu.
 */
export const KeyboardNav: Story = {
  render: () => {
    function Combobox() {
      const [query, setQuery] = useState("");
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
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search…"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="sm-listbox"
            aria-activedescendant={
              activeIndex >= 0 ? `sm-opt-${activeIndex}` : undefined
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 14px",
              border: "3px solid var(--color-border)",
              borderRadius: 9999,
              fontSize: 16,
            }}
          />
          <div style={{ marginTop: 8 }}>
            <SuggestionMenu
              id="sm-listbox"
              itemIdPrefix="sm-opt"
              items={items}
              activeIndex={activeIndex}
              onSelect={s => setQuery(s.label)}
            />
          </div>
        </div>
      );
    }
    return <Combobox />;
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("combobox");
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
  },
};
