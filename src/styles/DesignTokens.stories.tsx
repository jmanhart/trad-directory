import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Design System/Design Tokens",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const ColorPalette: Story = {
  render: () => {
    const palette = [
      {
        name: "Black / Neutral",
        description: "Ink / Neutral colors",
        colors: [
          { name: "200", var: "--black-200", value: "#1F1F1F", description: "Lighter fill / highlight" },
          { name: "300", var: "--black-300", value: "#141414", description: "Base fill" },
          { name: "400", var: "--black-400", value: "#0A0A0A", description: "Darker fill / emphasis" },
        ],
      },
      {
        name: "Red",
        description: "Trad Core red palette",
        colors: [
          { name: "200", var: "--red-200", value: "#F07A76", description: "Lighter fill / highlight" },
          { name: "300", var: "--red-300", value: "#D9534F", description: "Base fill" },
          { name: "400", var: "--red-400", value: "#9C0101", description: "Darker fill / emphasis" },
        ],
      },
      {
        name: "Yellow",
        description: "Trad Core yellow palette",
        colors: [
          { name: "200", var: "--yellow-200", value: "#E8C866", description: "Lighter fill / highlight" },
          { name: "300", var: "--yellow-300", value: "#D4AF37", description: "Base fill" },
          { name: "400", var: "--yellow-400", value: "#B08900", description: "Darker fill / emphasis" },
        ],
      },
      {
        name: "Green",
        description: "Trad Core green palette",
        colors: [
          { name: "200", var: "--green-200", value: "#4F8F63", description: "Lighter fill / highlight" },
          { name: "300", var: "--green-300", value: "#2F6B3F", description: "Base fill" },
          { name: "400", var: "--green-400", value: "#1F4D2B", description: "Darker fill / emphasis" },
        ],
      },
      {
        name: "Blue",
        description: "Trad Core blue palette",
        colors: [
          { name: "200", var: "--blue-200", value: "#5C79B3", description: "Lighter fill / highlight" },
          { name: "300", var: "--blue-300", value: "#2F4F88", description: "Base fill" },
          { name: "400", var: "--blue-400", value: "#1B2E59", description: "Darker fill / emphasis" },
        ],
      },
      {
        name: "Orange",
        description: "Trad Core orange palette",
        colors: [
          { name: "200", var: "--orange-200", value: "#E08A45", description: "Lighter fill / highlight" },
          { name: "300", var: "--orange-300", value: "#C4621A", description: "Base fill" },
          { name: "400", var: "--orange-400", value: "#9E4A14", description: "Darker fill / emphasis" },
        ],
      },
      {
        name: "Brown",
        description: "Trad Core brown palette",
        colors: [
          { name: "200", var: "--brown-200", value: "#8C6553", description: "Lighter fill / highlight" },
          { name: "300", var: "--brown-300", value: "#6A4534", description: "Base fill" },
          { name: "400", var: "--brown-400", value: "#4A2F24", description: "Darker fill / emphasis" },
        ],
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
        <div>
          <h2 style={{ marginBottom: "0.5rem", color: "var(--color-text-primary)", fontSize: "1.5rem", fontWeight: 700 }}>
            Color Palette
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "2rem" }}>
            Raw color tokens organized by hue. Step 200 = lighter fill/highlight, 300 = base fill, 400 = darker fill/emphasis.
          </p>
        </div>
        {palette.map((group) => (
          <div key={group.name}>
            <h3 style={{ marginBottom: "0.5rem", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 600 }}>
              {group.name}
            </h3>
            {group.description && (
              <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {group.description}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              {group.colors.map((color) => (
                <div
                  key={color.var}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "var(--color-surface)",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div
                    style={{
                      height: "140px",
                      backgroundColor: color.value,
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  />
                  <div style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem", fontSize: "1rem", color: "var(--color-text-primary)" }}>
                      {group.name} {color.name}
                    </div>
                    {color.description && (
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: "0.5rem" }}>
                        {color.description}
                      </div>
                    )}
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem", fontFamily: "monospace" }}>
                      {color.value}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
                      {color.var}
                    </div>
                  </div>
                </div>
              ))}
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
      <div>
        <h2 style={{ marginBottom: "0.5rem", color: "var(--color-text-primary)", fontSize: "1.5rem", fontWeight: 700 }}>
          Spacing Scale
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Consistent spacing tokens for margins, padding, and gaps.
        </p>
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
      <div>
        <h2 style={{ marginBottom: "0.5rem", color: "var(--color-text-primary)", fontSize: "1.5rem", fontWeight: 700 }}>
          Typography Scale
        </h2>
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            Font size tokens for consistent typography hierarchy.
          </p>
          <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem", margin: 0 }}>
            <strong>Font Family:</strong> Inter, system-ui, Avenir, Helvetica, Arial, sans-serif
          </p>
          <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
            <strong>Line Height:</strong> 1.5
          </p>
          <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
            <strong>Font Weight:</strong> 400 (base), 500 (medium), 600 (semibold), 700 (bold)
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {typeTokens.map((type) => (
            <div key={type.var}>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)", marginBottom: "0.5rem", fontFamily: "monospace" }}>
                {type.var} ({type.value})
              </div>
              <div style={{ fontSize: `var(${type.var})`, fontWeight: 400, color: "var(--color-text-primary)", fontFamily: "Inter, system-ui, sans-serif" }}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
};
