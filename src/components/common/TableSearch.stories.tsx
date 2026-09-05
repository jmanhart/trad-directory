import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent } from "@storybook/test";
import TableSearch, { type TableSearchProps } from "./TableSearch";

/** Controlled wrapper so the input is interactive in every story. */
function TableSearchDemo(props: TableSearchProps) {
  const [value, setValue] = useState(props.value ?? "");
  return <TableSearch {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Search/TableSearch",
  component: TableSearch,
  parameters: { layout: "padded" },
  render: args => <TableSearchDemo {...args} />,
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Search artists…",
  },
} satisfies Meta<typeof TableSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full-width variant used above data tables on the embedded admin pages. */
export const Full: Story = {};

/** Fixed, responsive-width pill for toolbars — caps at 320px, shrinks below. */
export const Compact: Story = {
  args: { variant: "compact" },
};

/** Optional result summary rendered beside the input (off by default). */
export const WithCount: Story = {
  args: { value: "seattle", resultCount: "29 of 1275 artists" },
};

/**
 * Compact search inside a mock 56px sticky header bar — proves the control
 * fits the bar height without overflowing into the content below.
 */
export const InHeaderBar: Story = {
  args: { variant: "compact" },
  render: args => (
    <div
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0 1rem",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <strong
        style={{ color: "var(--color-primary)", whiteSpace: "nowrap" }}
      >
        Artists · Shops · Cities
      </strong>
      <TableSearchDemo {...args} />
    </div>
  ),
};

/** Types a query to exercise the controlled input wiring. */
export const Typing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "seattle");
  },
};
