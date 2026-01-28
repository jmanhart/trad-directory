import type { Meta, StoryObj } from "@storybook/react";
import { FormGroup, Label, Input, Textarea, Select, Button, SubmitButton, Message, HelperText } from "./FormComponents";

const meta: Meta<typeof FormGroup> = {
  title: "Components/Form Components",
  component: FormGroup,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Reusable form components for building consistent forms throughout the application. These components follow the design system tokens and provide a consistent look and feel.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormGroup>;

// Overview story showing all components together
export const Overview: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "500px" }}>
      <div>
        <h3 style={{ marginBottom: "1rem", color: "var(--color-text-primary)" }}>Form Components Overview</h3>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
          The form components are organized into the following sections:
        </p>
        <ul style={{ color: "var(--color-text-secondary)", paddingLeft: "1.5rem" }}>
          <li><strong>Buttons</strong> - Primary, secondary, outline, and submit button variants</li>
          <li><strong>Inputs</strong> - Text inputs with various types, states, and sizes</li>
          <li><strong>Textareas</strong> - Multi-line text input components</li>
          <li><strong>Selects</strong> - Dropdown select components</li>
          <li><strong>Messages</strong> - Success, error, and info message components</li>
          <li><strong>Forms</strong> - Complete form examples with validation</li>
        </ul>
      </div>

      <div>
        <h4 style={{ marginBottom: "0.75rem", color: "var(--color-text-primary)" }}>Quick Example</h4>
        <form>
          <FormGroup>
            <Label htmlFor="overview-name" required>
              Name
            </Label>
            <Input id="overview-name" placeholder="Your name" />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="overview-email" required>
              Email
            </Label>
            <Input id="overview-email" type="email" placeholder="your@email.com" />
            <HelperText>We'll never share your email</HelperText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="overview-message">Message</Label>
            <Textarea id="overview-message" rows={4} placeholder="Your message..." />
          </FormGroup>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <SubmitButton>Submit</SubmitButton>
            <Button variant="secondary" type="button">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  ),
};
