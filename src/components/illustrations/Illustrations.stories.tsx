import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Design System/Illustrations",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Illustration library from the FLASH folder. These SVG illustrations are used throughout the application for decorative and branding purposes.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const illustrations = [
  { name: "Anchor Handshake", path: "/FLASH/ANCHOR_HANDSHAKE.svg" },
  { name: "Boxing", path: "/FLASH/BOXING.svg" },
  { name: "Bulldog", path: "/FLASH/BULLDOG.svg" },
  { name: "Butterfly", path: "/FLASH/BUTTERFLY.svg" },
  { name: "Devil", path: "/FLASH/DEVIL.svg" },
  { name: "Diamond", path: "/FLASH/DIAMOND.svg" },
  { name: "Dice", path: "/FLASH/DICE.svg" },
  { name: "Directory", path: "/FLASH/DIRECTORY.svg" },
  { name: "Eagle", path: "/FLASH/EAGLE.svg" },
  { name: "Flower Duo", path: "/FLASH/FLOWER_DUO.svg" },
  { name: "Flower Eyeball", path: "/FLASH/FLOWER_EYEBALL.svg" },
  { name: "Flower", path: "/FLASH/FLOWER.svg" },
  { name: "Flower 1", path: "/FLASH/FLOWER-1.svg" },
  { name: "Flowers Small", path: "/FLASH/FLOWERS_SMALL.svg" },
  { name: "Heart Knife", path: "/FLASH/HEART_KNIFE.svg" },
  { name: "Knife", path: "/FLASH/KNIFE.svg" },
  { name: "Ladyhead Sailor", path: "/FLASH/LADYHEAD_SAILOR.svg" },
  { name: "Lighthouse", path: "/FLASH/LIGHTHOUSE.svg" },
  { name: "Panther Head", path: "/FLASH/PANTHER_HEAD.svg" },
  { name: "Pantherhead Knife", path: "/FLASH/PANTHERHEAD_KNIFE.svg" },
  { name: "Rose Single", path: "/FLASH/ROSE_SINGLE.svg" },
  { name: "Sharks", path: "/FLASH/SHARKS.svg" },
  { name: "Ship", path: "/FLASH/SHIP.svg" },
  { name: "Skull Tophat", path: "/FLASH/SKULL_TOPHAT.svg" },
  { name: "Skull Winged", path: "/FLASH/SKULLWINGED.svg" },
  { name: "Snake and Skull", path: "/FLASH/SNAKE_AND_SKULL.svg" },
  { name: "Sparrow", path: "/FLASH/SPARROW.svg" },
  { name: "Spider", path: "/FLASH/SPIDER.svg" },
  { name: "Wolf", path: "/FLASH/WOLF.svg" },
];

export const AllIllustrations: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h2 style={{ marginBottom: "0.5rem", color: "var(--color-text-primary)", fontSize: "1.5rem", fontWeight: 700 }}>
          FLASH Illustrations
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          Collection of traditional tattoo flash illustrations used throughout the application.
        </p>
        <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem", margin: 0 }}>
          <strong>Total:</strong> {illustrations.length} illustrations
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
        {illustrations.map((ill) => (
          <div
            key={ill.path}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "var(--color-surface)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div
              style={{
                width: "120px",
                height: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "4px",
                padding: "0.5rem",
              }}
            >
              <img
                src={ill.path}
                alt={ill.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  console.error(`Failed to load: ${ill.path}`);
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>
                {ill.name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "monospace", wordBreak: "break-all" }}>
                {ill.path}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};
