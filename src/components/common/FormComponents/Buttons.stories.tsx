import type { Meta, StoryObj } from "@storybook/react";
import { Button, SubmitButton } from "../FormComponents";

const meta: Meta<typeof Button> = {
  title: "Components/Form Components/Buttons",
  component: Button,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Buttons: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
      <Button variant="primary">Primary Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="outline">Outline Button</Button>
      <SubmitButton>Submit Button</SubmitButton>
    </div>
  ),
};

export const ButtonStates: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
      <Button variant="primary">Normal</Button>
      <Button variant="primary" disabled>Disabled</Button>
      <Button variant="primary" loading>Loading</Button>
      <Button variant="primary" loading loadingText="Saving...">Save</Button>
    </div>
  ),
};

export const ButtonVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "300px" }}>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Button variant="primary">Primary</Button>
        <Button variant="primary" disabled>Primary Disabled</Button>
      </div>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Button variant="secondary">Secondary</Button>
        <Button variant="secondary" disabled>Secondary Disabled</Button>
      </div>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Button variant="outline">Outline</Button>
        <Button variant="outline" disabled>Outline Disabled</Button>
      </div>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <SubmitButton>Submit</SubmitButton>
        <SubmitButton disabled>Submit Disabled</SubmitButton>
        <SubmitButton loading>Submit Loading</SubmitButton>
      </div>
    </div>
  ),
};
