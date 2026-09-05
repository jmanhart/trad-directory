import type { Meta, StoryObj } from "@storybook/react";
import { fn, within, userEvent } from "@storybook/test";
import SearchBar from "./SearchBar";
import { mockSuggestions } from "./__fixtures__/suggestions.mock";

const meta = {
  title: "Search/SearchBar",
  component: SearchBar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The centralized public site search: a combobox with a grouped, keyboard-navigable suggestions menu (artists / shops / locations). Sizes: small | medium | large | compact. Mounted in the home hero, global header, mobile top bar, and map overlay.",
      },
    },
  },
  args: { onSearch: fn(), onSelectSuggestion: fn(), suggestions: mockSuggestions },
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
