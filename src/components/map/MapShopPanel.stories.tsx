import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import MapShopPanel from "./MapShopPanel";
import { mockShop } from "../../stories/fixtures";

const meta = {
  title: "Map/MapShopPanel",
  component: MapShopPanel,
  parameters: { layout: "centered" },
  decorators: [
    Story => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: { shop: mockShop, onClose: fn(), onArtistClick: fn() },
} satisfies Meta<typeof MapShopPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBackButton: Story = { args: { showBackButton: true } };

export const NoArtists: Story = {
  args: { shop: { ...mockShop, artists: [] } },
};
