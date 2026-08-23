import type { Meta, StoryObj } from "@storybook/react";
import { fn, within, userEvent } from "@storybook/test";
import SearchBar from "./SearchBar";
import type { Suggestion } from "../../utils/suggestions";

const suggestions: Suggestion[] = [
  { label: "Sailor Jerry", type: "artist", detail: "@sailorjerry", id: 1 },
  { label: "Ed Hardy", type: "artist", detail: "@edhardy", id: 2 },
  { label: "Kari Barba", type: "artist", detail: "@karibarba", id: 4 },
  { label: "Old Ironside Tattoo", type: "shop", detail: "Honolulu, HI", id: 10 },
  { label: "Outer Limits Tattoo", type: "shop", detail: "Anaheim, CA", id: 12 },
  { label: "Honolulu, Hawaii", type: "location", artistCount: 12 },
  { label: "Long Beach, California", type: "location", artistCount: 7 },
];

const meta = {
  title: "Search/SearchBar",
  component: SearchBar,
  parameters: { layout: "padded" },
  args: { onSearch: fn(), onSelectSuggestion: fn(), suggestions },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = { args: { size: "compact" } };

export const Large: Story = { args: { size: "large" } };

/** Types a query so the grouped suggestions dropdown is visible. */
export const SuggestionsOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "a");
  },
};
