import type { Meta, StoryObj } from "@storybook/react";
import { Message } from "../FormComponents";

const meta: Meta<typeof Message> = {
  title: "Components/Form Components/Messages",
  component: Message,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Message>;

export const Messages: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
      <Message type="success" text="Operation completed successfully!" />
      <Message type="error" text="An error occurred. Please try again." />
      <Message type="info" text="Here's some helpful information." />
    </div>
  ),
};
