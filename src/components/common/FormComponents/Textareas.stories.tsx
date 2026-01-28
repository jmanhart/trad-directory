import type { Meta, StoryObj } from "@storybook/react";
import { FormGroup, Label, Textarea } from "../FormComponents";

const meta: Meta<typeof Textarea> = {
  title: "Components/Form Components/Textareas",
  component: Textarea,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const TextareaField: Story = {
  render: () => (
    <FormGroup>
      <Label htmlFor="example-textarea">Message</Label>
      <Textarea id="example-textarea" rows={4} placeholder="Enter your message..." />
    </FormGroup>
  ),
};

export const TextareaVariations: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "400px" }}>
      <FormGroup>
        <Label htmlFor="default-textarea">Default Textarea</Label>
        <Textarea id="default-textarea" rows={4} placeholder="Enter your message..." />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="filled-textarea">Filled Textarea</Label>
        <Textarea id="filled-textarea" rows={4} defaultValue="This is some pre-filled text content." />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="disabled-textarea">Disabled Textarea</Label>
        <Textarea id="disabled-textarea" rows={4} placeholder="Disabled" disabled />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="resize-none">No Resize</Label>
        <Textarea 
          id="resize-none" 
          rows={4} 
          placeholder="Cannot resize" 
          style={{ resize: "none" }}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="large-textarea">Large Textarea</Label>
        <Textarea id="large-textarea" rows={8} placeholder="Enter a longer message..." />
      </FormGroup>
    </div>
  ),
};
