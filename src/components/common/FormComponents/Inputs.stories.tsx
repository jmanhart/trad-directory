import type { Meta, StoryObj } from "@storybook/react";
import { FormGroup, Label, Input, HelperText } from "../FormComponents";

const meta: Meta<typeof Input> = {
  title: "Components/Form Components/Inputs",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const InputField: Story = {
  render: () => (
    <FormGroup>
      <Label htmlFor="example-input">Example Input</Label>
      <Input id="example-input" placeholder="Enter text..." />
    </FormGroup>
  ),
};

export const RequiredInput: Story = {
  render: () => (
    <FormGroup>
      <Label htmlFor="required-input" required>
        Required Field
      </Label>
      <Input id="required-input" placeholder="This field is required" />
    </FormGroup>
  ),
};

export const InputTypes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "400px" }}>
      <FormGroup>
        <Label htmlFor="text-input">Text Input</Label>
        <Input id="text-input" type="text" placeholder="Enter text..." />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="email-input">Email Input</Label>
        <Input id="email-input" type="email" placeholder="your@email.com" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="password-input">Password Input</Label>
        <Input id="password-input" type="password" placeholder="Enter password" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="number-input">Number Input</Label>
        <Input id="number-input" type="number" placeholder="Enter number" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="tel-input">Telephone Input</Label>
        <Input id="tel-input" type="tel" placeholder="(555) 123-4567" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="url-input">URL Input</Label>
        <Input id="url-input" type="url" placeholder="https://example.com" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="date-input">Date Input</Label>
        <Input id="date-input" type="date" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="search-input">Search Input</Label>
        <Input id="search-input" type="search" placeholder="Search..." />
      </FormGroup>
    </div>
  ),
};

export const InputStates: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "400px" }}>
      <FormGroup>
        <Label htmlFor="default-input">Default State</Label>
        <Input id="default-input" placeholder="Default input" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="filled-input">Filled State</Label>
        <Input id="filled-input" defaultValue="John Doe" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="disabled-input">Disabled State</Label>
        <Input id="disabled-input" placeholder="Disabled input" disabled />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="readonly-input">Readonly State</Label>
        <Input id="readonly-input" defaultValue="Readonly value" readOnly />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="error-input">Error State (with helper text)</Label>
        <Input 
          id="error-input" 
          placeholder="Invalid input" 
          style={{ borderColor: "var(--color-error)" }}
        />
        <HelperText style={{ color: "var(--color-error)" }}>
          This field is required
        </HelperText>
      </FormGroup>
    </div>
  ),
};

export const InputSizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "400px" }}>
      <FormGroup>
        <Label htmlFor="small-input">Small Input</Label>
        <Input 
          id="small-input" 
          placeholder="Small input" 
          style={{ padding: "0.5rem", fontSize: "0.875rem" }}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="default-input-size">Default Input</Label>
        <Input id="default-input-size" placeholder="Default input" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="large-input">Large Input</Label>
        <Input 
          id="large-input" 
          placeholder="Large input" 
          style={{ padding: "1rem", fontSize: "1.125rem" }}
        />
      </FormGroup>
    </div>
  ),
};
