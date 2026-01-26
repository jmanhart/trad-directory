import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Design System/Design Tokens",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Colors: Story = {
  render: () => {
    // Group colors by their actual hex value to show duplicates
    const colorGroups = [
      {
        value: "#9C0101",
        tokens: [
          { name: "Primary", var: "--color-primary" },
          { name: "Border", var: "--color-border" },
          { name: "Text Primary", var: "--color-text-primary" },
          { name: "Text Secondary", var: "--color-text-secondary" },
          { name: "Text Tertiary", var: "--color-text-tertiary" },
          { name: "Red Dark", var: "--color-red-dark" },
        ],
      },
      {
        value: "#FFC4C4",
        tokens: [{ name: "Background", var: "--color-background" }],
      },
      {
        value: "#f9f9f9",
        tokens: [{ name: "Surface", var: "--color-surface" }],
      },
      {
        value: "#d9534f",
        tokens: [{ name: "Error", var: "--color-error" }],
      },
      {
        value: "#FF0000",
        tokens: [{ name: "Red", var: "--color-red" }],
      },
      {
        value: "#FF3333",
        tokens: [{ name: "Red Light", var: "--color-red-light" }],
      },
    ];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.5rem" }}>
        {colorGroups.map((group, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <div
              style={{
                height: "100px",
                backgroundColor: group.value,
                borderBottom: "1px solid var(--color-border)",
              }}
            />
            <div style={{ padding: "1rem" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem" }}>
                {group.value}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {group.tokens.map((token) => (
                  <div key={token.var} style={{ fontSize: "0.85rem" }}>
                    <div style={{ fontWeight: 500, marginBottom: "0.125rem", color: "var(--color-text-primary)" }}>
                      {token.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-tertiary)",
                        fontFamily: "monospace",
                      }}
                    >
                      {token.var}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  },
};

export const Spacing: Story = {
  render: () => {
    const spacingTokens = [
      { name: "XS", var: "--spacing-xs", value: "0.25rem" },
      { name: "SM", var: "--spacing-sm", value: "0.5rem" },
      { name: "MD", var: "--spacing-md", value: "1rem" },
      { name: "LG", var: "--spacing-lg", value: "1.5rem" },
      { name: "XL", var: "--spacing-xl", value: "2rem" },
      { name: "2XL", var: "--spacing-2xl", value: "3rem" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {spacingTokens.map((spacing) => (
          <div key={spacing.var} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ minWidth: "60px", fontWeight: 600 }}>{spacing.name}</div>
            <div
              style={{
                width: `var(${spacing.var})`,
                height: "24px",
                backgroundColor: "var(--color-primary)",
                borderRadius: "4px",
              }}
            />
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
              {spacing.var} ({spacing.value})
            </div>
          </div>
        ))}
      </div>
    );
  },
};

export const Typography: Story = {
  render: () => {
    const typeTokens = [
      { name: "XS", var: "--font-size-xs", value: "0.75rem" },
      { name: "SM", var: "--font-size-sm", value: "0.875rem" },
      { name: "Base", var: "--font-size-base", value: "1rem" },
      { name: "LG", var: "--font-size-lg", value: "1.25rem" },
      { name: "XL", var: "--font-size-xl", value: "1.5rem" },
      { name: "2XL", var: "--font-size-2xl", value: "2rem" },
      { name: "3XL", var: "--font-size-3xl", value: "3.2rem" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {typeTokens.map((type) => (
          <div key={type.var}>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)", marginBottom: "0.5rem", fontFamily: "monospace" }}>
              {type.var} ({type.value})
            </div>
            <div style={{ fontSize: `var(${type.var})`, fontWeight: 400 }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        ))}
      </div>
    );
  },
};
