import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import ArtistCard from "./ArtistCard";

const meta: Meta<typeof ArtistCard> = {
  title: "Components/ArtistCard",
  component: ArtistCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: "400px" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ArtistCard>;

const mockArtist = {
  id: 1,
  name: "John Doe",
  instagram_handle: "johndoe_tattoo",
  city_name: "Los Angeles",
  state_name: "California",
  country_name: "United States",
  shop_name: "Ink Shop",
  is_traveling: false,
};

export const Default: Story = {
  args: {
    artist: mockArtist,
    showTimestamp: false,
  },
};

export const WithTimestamp: Story = {
  args: {
    artist: {
      ...mockArtist,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    showTimestamp: true,
  },
};

export const TravelingArtist: Story = {
  args: {
    artist: {
      ...mockArtist,
      name: "Jane Smith",
      instagram_handle: "janesmith_tattoo",
      is_traveling: true,
    },
  },
};

export const NoInstagram: Story = {
  args: {
    artist: {
      ...mockArtist,
      name: "Bob Artist",
      instagram_handle: undefined,
    },
  },
};

export const MinimalInfo: Story = {
  args: {
    artist: {
      id: 2,
      name: "Minimal Artist",
      instagram_handle: "minimal",
    },
  },
};

export const International: Story = {
  args: {
    artist: {
      ...mockArtist,
      name: "Tokyo Tattoo",
      instagram_handle: "tokyo_tattoo",
      city_name: "Tokyo",
      state_name: undefined,
      country_name: "Japan",
    },
  },
};

export const Grid: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
      <ArtistCard artist={mockArtist} />
      <ArtistCard artist={{ ...mockArtist, name: "Jane Smith", instagram_handle: "janesmith" }} />
      <ArtistCard artist={{ ...mockArtist, name: "Traveling Artist", is_traveling: true }} />
      <ArtistCard artist={{ ...mockArtist, name: "No Location", city_name: undefined, state_name: undefined, country_name: undefined }} />
    </div>
  ),
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};
