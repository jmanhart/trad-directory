import type { Meta, StoryObj } from "@storybook/react";
import InstagramIcon from "./instagramIcon";
import ArtistsIcon from "./artistsIcon";
import ShopsIcon from "./shopsIcon";
import SearchIcon from "./searchIcon";
import GlobeIcon from "./globeIcon";
import AboutIcon from "./aboutIcon";
import SliderIcon from "./sliderIcon";

const meta: Meta = {
  title: "Design System/Icons",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

const iconList = [
  { name: "Instagram", component: InstagramIcon, description: "Social media link icon" },
  { name: "Artists", component: ArtistsIcon, description: "Artist/person icon" },
  { name: "Shops", component: ShopsIcon, description: "Shop/building icon" },
  { name: "Search", component: SearchIcon, description: "Search/magnifying glass icon" },
  { name: "Globe", component: GlobeIcon, description: "Globe/world icon" },
  { name: "About", component: AboutIcon, description: "Info/about icon" },
  { name: "Slider", component: SliderIcon, description: "Slider/filter icon" },
];

export const AllIcons: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "2rem", padding: "2rem" }}>
      {iconList.map(({ name, component: Icon, description }) => (
        <div
          key={name}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            padding: "1.5rem",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              color: "var(--color-primary)",
            }}
          >
            <Icon style={{ width: "100%", height: "100%" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "var(--color-text-primary)" }}>
              {name}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
              {description}
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const IconSizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "2rem" }}>
      {iconList.map(({ name, component: Icon }) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <div style={{ minWidth: "120px", fontWeight: 600 }}>{name}:</div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <Icon style={{ width: "16px", height: "16px" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>16px</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <Icon style={{ width: "20px", height: "20px" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>20px</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <Icon style={{ width: "24px", height: "24px" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>24px</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <Icon style={{ width: "32px", height: "32px" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>32px</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <Icon style={{ width: "40px", height: "40px" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>40px</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const IconColors: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1.5rem", padding: "2rem" }}>
      {iconList.map(({ name, component: Icon }) => (
        <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{name}</div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
              <Icon style={{ width: "24px", height: "24px", color: "var(--color-primary)" }} />
              <span style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)" }}>Primary</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
              <Icon style={{ width: "24px", height: "24px", color: "var(--color-text-secondary)" }} />
              <span style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)" }}>Secondary</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
              <Icon style={{ width: "24px", height: "24px", color: "var(--color-text-tertiary)" }} />
              <span style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)" }}>Tertiary</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};
