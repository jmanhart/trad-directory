import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
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
} from "../FormComponents";

const meta: Meta<typeof FormGroup> = {
  title: "Components/Form Components/Forms",
  component: FormGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormGroup>;

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
        <Label htmlFor="country">Country</Label>
        <Select id="country">
          <option value="">Select a country...</option>
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
          <option value="ca">Canada</option>
        </Select>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={4} placeholder="Your message..." />
      </FormGroup>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <SubmitButton>Submit</SubmitButton>
        <Button variant="secondary" type="button">Cancel</Button>
      </div>
    </form>
  ),
};

export const FormWithValidation: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      message: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};
      
      if (!formData.name) newErrors.name = "Name is required";
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid";
      }
      if (!formData.message) newErrors.message = "Message is required";

      setErrors(newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
      }
    };

    return (
      <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
        {submitted && <Message type="success" text="Form submitted successfully!" />}
        
        <FormGroup>
          <Label htmlFor="val-name" required>
            Name
          </Label>
          <Input 
            id="val-name" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your name"
            style={errors.name ? { borderColor: "var(--color-error)" } : {}}
          />
          {errors.name && (
            <HelperText style={{ color: "var(--color-error)" }}>
              {errors.name}
            </HelperText>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="val-email" required>
            Email
          </Label>
          <Input 
            id="val-email" 
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            style={errors.email ? { borderColor: "var(--color-error)" } : {}}
          />
          {errors.email ? (
            <HelperText style={{ color: "var(--color-error)" }}>
              {errors.email}
            </HelperText>
          ) : (
            <HelperText>We'll never share your email</HelperText>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="val-message" required>
            Message
          </Label>
          <Textarea 
            id="val-message" 
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Your message..."
            style={errors.message ? { borderColor: "var(--color-error)" } : {}}
          />
          {errors.message && (
            <HelperText style={{ color: "var(--color-error)" }}>
              {errors.message}
            </HelperText>
          )}
        </FormGroup>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <SubmitButton>Submit</SubmitButton>
          <Button variant="secondary" type="button" onClick={() => {
            setFormData({ name: "", email: "", message: "" });
            setErrors({});
          }}>
            Reset
          </Button>
        </div>
      </form>
    );
  },
};
