import type { Meta, StoryObj } from "@storybook/react";
import { fn, within, userEvent } from "@storybook/test";
import SuggestionItem from "./SuggestionItem";
import { mockSuggestions } from "./__fixtures__/suggestions.mock";

const meta = {
  title: "Search/SuggestionItem",
  component: SuggestionItem,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "One row in the search suggestions menu — a typed icon, label, optional detail, and (for locations) an artist count. States: rest, hover (pointer), active (keyboard ↑/↓, sets aria-selected), pressed. The parent SuggestionMenu decides which row is active.",
      },
    },
  },
  args: { onSelect: fn() },
  // A single option must live inside a role="listbox" to be valid — but keep it
  // a plain, full-width row here. The menu's border/radius/shadow chrome belongs
  // to SuggestionMenu, not to an individual item.
  decorators: [
    Story => (
      <ul
        role="listbox"
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          maxWidth: 420,
          background: "var(--color-surface)",
        }}
      >
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof SuggestionItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Artist: Story = {
  args: {
    suggestion: { label: "Sailor Jerry", type: "artist", detail: "@sailorjerry", id: 1 },
  },
};

export const Shop: Story = {
  args: {
    suggestion: { label: "Old Ironside Tattoo", type: "shop", detail: "Honolulu, HI", id: 10 },
  },
};

export const Location: Story = {
  args: {
    suggestion: { label: "Long Beach, California", type: "location", artistCount: 7 },
  },
};

/** Keyboard-highlighted row (arrow keys) — sets aria-selected + active style. */
export const Active: Story = {
  args: {
    active: true,
    suggestion: { label: "Kari Barba", type: "artist", detail: "@karibarba", id: 4 },
  },
};

/** Pointer hover state, driven by CSS. */
export const Hover: Story = {
  args: {
    suggestion: { label: "Ed Hardy", type: "artist", detail: "@edhardy", id: 2 },
  },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("option"));
  },
};

/** Long labels truncate with an ellipsis rather than wrapping. */
export const LongLabel: Story = {
  args: {
    suggestion: {
      label: "World Famous Spotlight Tattoo & Body Piercing Emporium",
      type: "shop",
      detail: "Los Angeles, CA",
      id: 99,
    },
  },
};

/** Optional type badge (used in debug mode). */
export const WithTypeBadge: Story = {
  args: {
    showTypeBadge: true,
    suggestion: { label: "Honolulu, Hawaii", type: "location", artistCount: 12 },
  },
};

/**
 * The full suggested list in context — every item type stacked in one listbox,
 * with one row keyboard-active. This is the "kitchen sink" visual reference;
 * the behavioral version (grouping + keyboard nav) lives on SuggestionMenu.
 */
export const AllItems: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "All suggestion types rendered together as they appear in the open menu.",
      },
    },
  },
  render: args => (
    <>
      {mockSuggestions.map((suggestion, i) => (
        <SuggestionItem
          key={`${suggestion.type}-${suggestion.id ?? suggestion.label}`}
          suggestion={suggestion}
          active={i === 2}
          onSelect={args.onSelect}
        />
      ))}
    </>
  ),
};
