import type { Meta, StoryObj } from "@storybook/react";
import Tag from "./Tag";

const meta = {
  title: "Common/Tag",
  component: Tag,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A small, static label chip (uppercase) for statuses/flags like BETA or NEW. Tones: primary (solid), soft (subtle tint, default), neutral (grey). For interactive chips use Pill; for counts use CountBadge.",
      },
    },
  },
  args: { children: "Beta" },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Soft: Story = { args: { tone: "soft" } };
export const Primary: Story = { args: { tone: "primary" } };
export const Neutral: Story = { args: { tone: "neutral", children: "New" } };

/** All tones side by side. */
export const AllTones: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <Tag tone="soft">Beta</Tag>
      <Tag tone="primary">Beta</Tag>
      <Tag tone="neutral">New</Tag>
    </div>
  ),
};
