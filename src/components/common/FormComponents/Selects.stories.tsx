import type { Meta, StoryObj } from "@storybook/react";
import { FormGroup, Label, Select } from "../FormComponents";

const meta: Meta<typeof Select> = {
  title: "Components/Form Components/Selects",
  component: Select,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

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

export const SelectVariations: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "400px" }}>
      <FormGroup>
        <Label htmlFor="basic-select">Basic Select</Label>
        <Select id="basic-select">
          <option value="">Choose an option...</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="selected-select">Pre-selected</Label>
        <Select id="selected-select" defaultValue="2">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="disabled-select">Disabled Select</Label>
        <Select id="disabled-select" disabled>
          <option value="">Disabled</option>
          <option value="1">Option 1</option>
        </Select>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="grouped-select">Grouped Options</Label>
        <Select id="grouped-select">
          <option value="">Select a category...</option>
          <optgroup label="Fruits">
            <option value="apple">Apple</option>
            <option value="banana">Banana</option>
            <option value="orange">Orange</option>
          </optgroup>
          <optgroup label="Vegetables">
            <option value="carrot">Carrot</option>
            <option value="broccoli">Broccoli</option>
            <option value="spinach">Spinach</option>
          </optgroup>
        </Select>
      </FormGroup>
    </div>
  ),
};
