import type { Meta, StoryObj, Decorator } from "@storybook/react";
import type { ReactNode } from "react";
import { fn, within, userEvent } from "@storybook/test";
import MapDetailPanel from "./MapDetailPanel";
import {
  mockArtists,
  mockArtistLongName,
  mockArtistsMany,
  mockShopEntries,
  mockCityDots,
} from "../../stories/fixtures";

// The panel fills its parent's height (scrolling list), so frame every story in
// a fixed-size card like the real map side panel. Gallery opts out via noFrame.
const frame: Decorator = (Story, ctx) =>
  ctx.parameters.noFrame ? (
    <Story />
  ) : (
    <div
      style={{
        width: 360,
        height: 600,
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

const base = {
  title: "Honolulu",
  subtitle: "Hawaii, United States",
  variant: "city" as const,
  artists: mockArtists.slice(0, 3),
  shops: mockShopEntries,
  onClose: fn(),
  onArtistClick: fn(),
  onShopClick: fn(),
  onStateClick: fn(),
  onCityClick: fn(),
};

const meta = {
  title: "Map/MapDetailPanel",
  component: MapDetailPanel,
  parameters: { layout: "centered" },
  decorators: [frame],
  args: base,
} satisfies Meta<typeof MapDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** City with both artists and shops → tabbed. */
export const City: Story = {};

/** City with only artists → no tabs, single artist count stat. */
export const ArtistsOnly: Story = { args: { shops: [] } };

/** City reached by drilling down — shows the breadcrumb trail. */
export const WithBreadcrumb: Story = {
  args: {
    title: "Maastricht",
    subtitle: "Netherlands",
    artists: mockArtists.slice(0, 2),
    shops: mockShopEntries.slice(0, 1),
    breadcrumb: [
      { label: "Netherlands", onClick: fn() },
      { label: "Maastricht" },
    ],
  },
};

/** Data still loading. */
export const Loading: Story = { args: { loading: true } };

/** No artists and no shops. */
export const Empty: Story = { args: { artists: [], shops: [] } };

/** Has shops but no artists — artists tab is empty, shops tab populated. */
export const EmptyArtistsWithShops: Story = { args: { artists: [] } };

/** Artists without Instagram handles — no trailing handle/icon. */
export const NoInstagram: Story = {
  args: { artists: [mockArtists[2]], shops: [] },
};

/** Long name + handle + shop name to check truncation. */
export const LongText: Story = {
  args: { artists: [mockArtistLongName], shops: [] },
};

/** Many artists — exercises the scrolling list. */
export const LongList: Story = {
  args: { title: "Portland", subtitle: "Oregon, United States", artists: mockArtistsMany, shops: [] },
};

/** Region variant — artists grouped by city (expandable). */
export const Region: Story = {
  args: {
    title: "United States",
    subtitle: "North America",
    variant: "region",
    artists: mockArtists,
    shops: mockShopEntries,
    cityDots: mockCityDots,
    breadcrumb: [{ label: "North America", onClick: fn() }, { label: "United States" }],
  },
};

/** Region variant grouped by state (US / Canada / Australia). */
export const RegionByState: Story = {
  args: {
    title: "United States",
    subtitle: "North America",
    variant: "region",
    groupBy: "state",
    artists: mockArtists,
    shops: mockShopEntries,
    cityDots: mockCityDots,
  },
};

/** Shops tab selected (via interaction). */
export const ShopsTab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Shops"));
  },
};

/** All permutations at a glance for style tightening. */
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
        {cell("City (tabs)", <MapDetailPanel {...base} />)}
        {cell("Artists only", <MapDetailPanel {...base} shops={[]} />)}
        {cell(
          "Breadcrumb",
          <MapDetailPanel
            {...base}
            title="Maastricht"
            subtitle="Netherlands"
            artists={mockArtists.slice(0, 2)}
            shops={mockShopEntries.slice(0, 1)}
            breadcrumb={[{ label: "Netherlands", onClick: fn() }, { label: "Maastricht" }]}
          />
        )}
        {cell("Loading", <MapDetailPanel {...base} loading />)}
        {cell("Empty", <MapDetailPanel {...base} artists={[]} shops={[]} />)}
        {cell("No Instagram", <MapDetailPanel {...base} artists={[mockArtists[2]]} shops={[]} />)}
        {cell("Long text", <MapDetailPanel {...base} artists={[mockArtistLongName]} shops={[]} />)}
        {cell("Long list", <MapDetailPanel {...base} title="Portland" subtitle="Oregon, United States" artists={mockArtistsMany} shops={[]} />)}
        {cell(
          "Region (by city)",
          <MapDetailPanel {...base} title="United States" subtitle="North America" variant="region" artists={mockArtists} cityDots={mockCityDots} />
        )}
        {cell(
          "Region (by state)",
          <MapDetailPanel {...base} title="United States" subtitle="North America" variant="region" groupBy="state" artists={mockArtists} cityDots={mockCityDots} />
        )}
      </div>
    );
  },
};
