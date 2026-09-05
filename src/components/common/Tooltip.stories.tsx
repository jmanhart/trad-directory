import type { Meta, StoryObj } from "@storybook/react";
import Tooltip from "./Tooltip";
import Tag from "./Tag";

const meta = {
  title: "Common/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A lightweight, accessible tooltip in the app's floating-surface style (white card, border, shadow). Appears on hover and keyboard focus; links the trigger to the bubble via aria-describedby. Placement: top (default) or bottom.",
      },
    },
  },
  args: {
    content: "This is a beta and still working out the kinks",
    children: <Tag tone="soft">Beta</Tag>,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover the tag (or tab to it) to reveal the tooltip. */
export const Default: Story = {};

/** Bubble below the trigger. */
export const Bottom: Story = { args: { placement: "bottom" } };

/** Forced open so the bubble is visible without hovering. */
export const Open: Story = { args: { open: true } };
