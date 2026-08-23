import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import MapArtistPanel from "./MapArtistPanel";
import { mockArtists } from "../../stories/fixtures";

const meta = {
  title: "Map/MapArtistPanel",
  component: MapArtistPanel,
  parameters: { layout: "centered" },
  decorators: [
    Story => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: { artist: mockArtists[0], onClose: fn() },
} satisfies Meta<typeof MapArtistPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBackButton: Story = { args: { showBackButton: true } };

/** A traveling artist with more than one shop location. */
export const Traveling: Story = { args: { artist: mockArtists[3] } };
