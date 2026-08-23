import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import MapDetailPanel from "./MapDetailPanel";
import { mockArtists, mockShopEntries } from "../../stories/fixtures";

const meta = {
  title: "Map/MapDetailPanel",
  component: MapDetailPanel,
  parameters: { layout: "centered" },
  decorators: [
    Story => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Honolulu",
    subtitle: "Hawaii, United States",
    variant: "city",
    artists: mockArtists.slice(0, 3),
    shops: mockShopEntries,
    onClose: fn(),
    onArtistClick: fn(),
    onShopClick: fn(),
  },
} satisfies Meta<typeof MapDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const City: Story = {};

export const Loading: Story = { args: { loading: true } };

export const Empty: Story = { args: { artists: [], shops: [] } };
