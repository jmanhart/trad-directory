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
  parameters: {
    docs: {
      description: {
        component:
          "Reusable form components for building consistent forms throughout the application. These components follow the design system tokens and provide a consistent look and feel.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormGroup>;
type ButtonStory = StoryObj<typeof Button>;

// Overview story showing all components together
export const Overview: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "500px",
      }}
    >
      <div>
        <h3
          style={{ marginBottom: "1rem", color: "var(--color-text-primary)" }}
        >
          Form Components Overview
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "1.5rem",
          }}
        >
          The form components are organized into the following sections:
        </p>
        <ul
          style={{
            color: "var(--color-text-secondary)",
            paddingLeft: "1.5rem",
          }}
        >
          <li>
            <strong>Buttons</strong> - Primary, secondary, outline, ghost, and
            submit; sizes small, medium, large
          </li>
          <li>
            <strong>Inputs</strong> - Text inputs with various types, states,
            and sizes
          </li>
          <li>
            <strong>Textareas</strong> - Multi-line text input components
          </li>
          <li>
            <strong>Selects</strong> - Dropdown select components
          </li>
          <li>
            <strong>Messages</strong> - Success, error, and info message
            components
          </li>
          <li>
            <strong>Forms</strong> - Complete form examples with validation
          </li>
        </ul>
      </div>

      <div>
        <h4
          style={{
            marginBottom: "0.75rem",
            color: "var(--color-text-primary)",
          }}
        >
          Quick Example
        </h4>
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
            <Input
              id="overview-email"
              type="email"
              placeholder="your@email.com"
            />
            <HelperText>We'll never share your email</HelperText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="overview-message">Message</Label>
            <Textarea
              id="overview-message"
              rows={4}
              placeholder="Your message..."
            />
          </FormGroup>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <SubmitButton>Submit</SubmitButton>
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  ),
};

// Button: interactive with args
export const ButtonPlayground: ButtonStory = {
  args: {
    children: "Button",
    variant: "primary",
    size: "medium",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost"],
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
  },
  render: args => <Button type="button" {...args} />,
};

// Button: all variants and sizes
export const Buttons: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "600px",
      }}
    >
      <div>
        <h3
          style={{ marginBottom: "1rem", color: "var(--color-text-primary)" }}
        >
          Button variants
        </h3>
        <p
          style={{ color: "var(--color-text-secondary)", marginBottom: "1rem" }}
        >
          Primary, secondary, outline, and ghost (text-link style). Default size
          is medium; large is the biggest.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <Button type="button" variant="primary">
            Primary
          </Button>
          <Button type="button" variant="secondary">
            Secondary
          </Button>
          <Button type="button" variant="outline">
            Outline
          </Button>
          <Button type="button" variant="ghost">
            Ghost (text link)
          </Button>
        </div>
      </div>
      <div>
        <h3
          style={{ marginBottom: "1rem", color: "var(--color-text-primary)" }}
        >
          Button sizes
        </h3>
        <p
          style={{ color: "var(--color-text-secondary)", marginBottom: "1rem" }}
        >
          large (biggest), medium (default), and small.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <Button type="button" size="large">
            Large
          </Button>
          <Button type="button" size="medium">
            Medium
          </Button>
          <Button type="button" size="small">
            Small
          </Button>
        </div>
      </div>
      <div>
        <h3
          style={{ marginBottom: "1rem", color: "var(--color-text-primary)" }}
        >
          Ghost at each size
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <Button type="button" variant="ghost" size="large">
            Large ghost
          </Button>
          <Button type="button" variant="ghost" size="medium">
            Medium ghost
          </Button>
          <Button type="button" variant="ghost" size="small">
            Small ghost
          </Button>
        </div>
      </div>
    </div>
  ),
};

// Dedicated story: all sizes for each variant
export const ButtonSizes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "700px",
      }}
    >
      <p
        style={{ color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}
      >
        Sizes: <strong>large</strong> (biggest), <strong>medium</strong>{" "}
        (default), <strong>small</strong>.
      </p>
      {(["primary", "secondary", "outline", "ghost"] as const).map(variant => (
        <div key={variant}>
          <h4
            style={{
              marginBottom: "0.75rem",
              color: "var(--color-text-primary)",
              textTransform: "capitalize",
              fontSize: "1rem",
            }}
          >
            {variant}
          </h4>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <Button type="button" variant={variant} size="large">
              Large
            </Button>
            <Button type="button" variant={variant} size="medium">
              Medium
            </Button>
            <Button type="button" variant={variant} size="small">
              Small
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
};
