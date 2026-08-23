import type { Meta, StoryObj } from "@storybook/react";
import { CountBadge } from "./CountBadge";

const meta = {
  title: "Common/CountBadge",
  component: CountBadge,
  parameters: { layout: "centered" },
  args: { count: 12 },
} satisfies Meta<typeof CountBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = { args: { active: true } };

export const Zero: Story = { args: { count: 0 } };

export const Large: Story = { args: { count: 348 } };
