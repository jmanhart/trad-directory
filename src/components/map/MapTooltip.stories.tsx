import type { Meta, StoryObj, Decorator } from "@storybook/react";
import type { ReactNode, CSSProperties } from "react";
import MapTooltip from "./MapTooltip";

// MapTooltip is position:fixed (it follows the cursor on the map). A `transform`
// on the wrapper establishes a containing block so the fixed tooltip resolves
// relative to the box instead of the viewport — keeping stories contained.
const box = (w: number, h: number): CSSProperties => ({
  position: "relative",
  transform: "translate(0, 0)",
  width: w,
  height: h,
  background: "#d4dade",
  borderRadius: 8,
});

const frame: Decorator = (Story, ctx) =>
  ctx.parameters.noFrame ? <Story /> : <div style={box(300, 110)}><Story /></div>;

const meta = {
  title: "Map/MapTooltip",
  component: MapTooltip,
  parameters: { layout: "centered" },
  decorators: [frame],
  args: {
    cityName: "Honolulu",
    stateName: "Hawaii",
    countryName: "United States",
    artistCount: 12,
    shopCount: 3,
    x: 0,
    y: 0,
  },
} satisfies Meta<typeof MapTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full location with both artist and shop counts. */
export const Default: Story = {};

/** Artists only — no shop count segment. */
export const ArtistsOnly: Story = { args: { shopCount: 0 } };

/** Singular counts use singular labels ("1 artist · 1 shop"). */
export const Singular: Story = { args: { artistCount: 1, shopCount: 1 } };

/** City with no state/country. */
export const CityOnly: Story = {
  args: { stateName: null, countryName: null },
};

/** Long location string. */
export const LongLocation: Story = {
  args: {
    cityName: "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch",
    stateName: "Anglesey",
    countryName: "United Kingdom",
    artistCount: 42,
    shopCount: 7,
  },
};

/** All permutations at a glance. */
export const All: Story = {
  parameters: { noFrame: true, layout: "padded" },
  render: () => {
    const cell = (label: string, node: ReactNode) => (
      <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ font: "600 12px/1 system-ui", color: "#6b7280" }}>{label}</span>
        <div style={box(300, 96)}>{node}</div>
      </div>
    );
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 24 }}>
        {cell("Default", <MapTooltip cityName="Honolulu" stateName="Hawaii" countryName="United States" artistCount={12} shopCount={3} x={0} y={0} />)}
        {cell("Artists only", <MapTooltip cityName="Honolulu" stateName="Hawaii" countryName="United States" artistCount={12} x={0} y={0} />)}
        {cell("Singular", <MapTooltip cityName="Maastricht" stateName={null} countryName="Netherlands" artistCount={1} shopCount={1} x={0} y={0} />)}
        {cell("City only", <MapTooltip cityName="Berlin" artistCount={8} shopCount={2} x={0} y={0} />)}
        {cell("Long location", <MapTooltip cityName="Llanfairpwllgwyngyllgogerychwyrndrobwll" stateName="Anglesey" countryName="United Kingdom" artistCount={42} shopCount={7} x={0} y={0} />)}
      </div>
    );
  },
};
