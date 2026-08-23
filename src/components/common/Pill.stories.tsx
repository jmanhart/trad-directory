import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import Pill from "./Pill";

const meta = {
  title: "Common/Pill",
  component: Pill,
  parameters: { layout: "centered" },
  args: { label: "Artists", count: 128, onClick: fn() },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutCount: Story = { args: { count: undefined } };

export const WithIcon: Story = {
  args: {
    label: "Traveling",
    count: 9,
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
};
