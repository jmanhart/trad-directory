import type { Meta, StoryObj } from "@storybook/react";
import {
  FormGroup,
  Label,
  Input,
  Textarea,
  Select,
  Button,
  SubmitButton,
  Message,
  HelperText,
} from "./FormComponents";

const meta: Meta<typeof FormGroup> = {
  title: "Components/Form Components",
  component: FormGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormGroup>;

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

export const TextareaField: Story = {
  render: () => (
    <FormGroup>
      <Label htmlFor="example-textarea">Message</Label>
      <Textarea id="example-textarea" rows={4} placeholder="Enter your message..." />
    </FormGroup>
  ),
};

export const SelectField: Story = {
  render: () => (
    <FormGroup>
      <Label htmlFor="example-select">Choose an option</Label>
      <Select id="example-select">
        <option value="">Select...</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </Select>
    </FormGroup>
  ),
};

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
    </div>
  ),
};

export const Messages: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
      <Message type="success" text="Operation completed successfully!" />
      <Message type="error" text="An error occurred. Please try again." />
      <Message type="info" text="Here's some helpful information." />
    </div>
  ),
};

export const CompleteForm: Story = {
  render: () => (
    <form style={{ maxWidth: "400px" }}>
      <FormGroup>
        <Label htmlFor="name" required>
          Name
        </Label>
        <Input id="name" placeholder="Your name" />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input id="email" type="email" placeholder="your@email.com" />
        <HelperText>We'll never share your email</HelperText>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={4} placeholder="Your message..." />
      </FormGroup>

      <SubmitButton>Submit</SubmitButton>
    </form>
  ),
};
