import type { Meta, StoryObj, Decorator } from "@storybook/react";
import type { ReactNode } from "react";
import { fn } from "@storybook/test";
import MapShopPanel from "./MapShopPanel";
import {
  mockShop,
  mockShopFull,
  mockShopMinimal,
  mockShopManyArtists,
} from "../../stories/fixtures";

// The panel fills its parent's height, so frame every story in a fixed-size
// card like the real map side panel. Gallery opts out via noFrame.
// (A router context is already provided globally in .storybook/preview.tsx.)
const frame: Decorator = (Story, ctx) =>
  ctx.parameters.noFrame ? (
    <Story />
  ) : (
    <div
      style={{
        width: 360,
        height: 560,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      <Story />
    </div>
  );

const meta = {
  title: "Map/MapShopPanel",
  component: MapShopPanel,
  parameters: { layout: "centered" },
  decorators: [frame],
  args: { shop: mockShop, onClose: fn(), onArtistClick: fn() },
} satisfies Meta<typeof MapShopPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shop with an address, Instagram, and a few resident artists. */
export const Default: Story = {};

/** Navigated into from a city/artist — includes a back button. */
export const WithBackButton: Story = { args: { showBackButton: true } };

/** Shop with no resident artists listed. */
export const NoArtists: Story = { args: { shop: { ...mockShop, artists: [] } } };

/** Every optional detail field populated (address, phone, website, contact, IG). */
export const FullDetails: Story = { args: { shop: mockShopFull } };

/** Only a name — no location, contact fields, Instagram, or artists. */
export const Minimal: Story = { args: { shop: mockShopMinimal } };

/** Many resident artists — exercises the scrolling list. */
export const ManyArtists: Story = { args: { shop: mockShopManyArtists } };

/** All permutations at a glance. */
export const All: Story = {
  parameters: { noFrame: true, layout: "padded" },
  render: () => {
    const cell = (label: string, node: ReactNode) => (
      <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ font: "600 12px/1 system-ui", color: "#6b7280" }}>{label}</span>
        <div
          style={{
            width: 320,
            height: 420,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          {node}
        </div>
      </div>
    );
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, background: "#eceef0", padding: 24 }}>
        {cell("Default", <MapShopPanel shop={mockShop} onClose={fn()} onArtistClick={fn()} />)}
        {cell("Back button", <MapShopPanel shop={mockShop} onClose={fn()} showBackButton />)}
        {cell("No artists", <MapShopPanel shop={{ ...mockShop, artists: [] }} onClose={fn()} />)}
        {cell("Full details", <MapShopPanel shop={mockShopFull} onClose={fn()} onArtistClick={fn()} />)}
        {cell("Minimal", <MapShopPanel shop={mockShopMinimal} onClose={fn()} />)}
        {cell("Many artists", <MapShopPanel shop={mockShopManyArtists} onClose={fn()} onArtistClick={fn()} />)}
      </div>
    );
  },
};
