import type { Meta, StoryObj } from "@storybook/react";
import Pill from "./Pill";

const meta: Meta<typeof Pill> = {
  title: "Components/Pill",
  component: Pill,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Pill>;

export const Default: Story = {
  args: {
    label: "Traditional",
  },
};

export const WithCount: Story = {
  args: {
    label: "Artists",
    count: 42,
  },
};

export const WithIcon: Story = {
  args: {
    label: "Location",
    icon: "📍",
  },
};

export const Clickable: Story = {
  args: {
    label: "Click me",
    onClick: () => alert("Clicked!"),
  },
};

export const AllVariations: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <Pill label="Simple" />
      <Pill label="With Count" count={12} />
      <Pill label="With Icon" icon="🎨" />
      <Pill label="Clickable" onClick={() => {}} />
      <Pill label="Full" count={5} icon="⭐" onClick={() => {}} />
    </div>
  ),
};
