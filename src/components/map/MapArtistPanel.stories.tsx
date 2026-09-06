import type { Meta, StoryObj, Decorator } from "@storybook/react";
import type { ReactNode } from "react";
import { fn } from "@storybook/test";
import MapArtistPanel from "./MapArtistPanel";
import {
  mockArtists,
  mockArtistNoShop,
  mockArtistLongName,
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
        height: 520,
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
  title: "Map/MapArtistPanel",
  component: MapArtistPanel,
  parameters: { layout: "centered" },
  decorators: [frame],
  args: { artist: mockArtists[0], onClose: fn() },
} satisfies Meta<typeof MapArtistPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Artist with Instagram, a single shop location. */
export const Default: Story = {};

/** Shown when navigated into from a shop/city — includes a back button. */
export const WithBackButton: Story = { args: { showBackButton: true } };

/** Traveling artist with more than one shop location. */
export const Traveling: Story = { args: { artist: mockArtists[3] } };

/** No Instagram handle — the footer is hidden. */
export const NoInstagram: Story = { args: { artist: mockArtists[2] } };

/** Artist with no shop association. */
export const NoShop: Story = { args: { artist: mockArtistNoShop } };

/** Long name, handle, and shop name — truncation check. */
export const LongText: Story = { args: { artist: mockArtistLongName } };

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
            height: 360,
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
        {cell("Default", <MapArtistPanel artist={mockArtists[0]} onClose={fn()} />)}
        {cell("Back button", <MapArtistPanel artist={mockArtists[0]} onClose={fn()} showBackButton />)}
        {cell("Traveling", <MapArtistPanel artist={mockArtists[3]} onClose={fn()} />)}
        {cell("No Instagram", <MapArtistPanel artist={mockArtists[2]} onClose={fn()} />)}
        {cell("No shop", <MapArtistPanel artist={mockArtistNoShop} onClose={fn()} />)}
        {cell("Long text", <MapArtistPanel artist={mockArtistLongName} onClose={fn()} />)}
      </div>
    );
  },
};
