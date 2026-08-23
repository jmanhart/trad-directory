import type { Meta, StoryObj } from "@storybook/react";
import LogoTypeSVG from "./LogoTypeSVG";

const meta = {
  title: "Brand/Logotype",
  component: LogoTypeSVG,
  parameters: {
    layout: "centered",
    backgrounds: { default: "surface" },
  },
  decorators: [
    Story => (
      <div style={{ width: 640, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
  args: { text: "Tattoo Directory", fontSize: 120 },
} satisfies Meta<typeof LogoTypeSVG>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Short: Story = { args: { text: "TRAD", fontSize: 200 } };

export const Small: Story = { args: { fontSize: 64 } };
