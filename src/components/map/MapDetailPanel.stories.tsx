import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import MapDetailPanel from "./MapDetailPanel";
import type { CityDot } from "./MapView";
import type { Artist } from "../../types/entities";

const meta: Meta<typeof MapDetailPanel> = {
  title: "Map/MapDetailPanel",
  component: MapDetailPanel,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MemoryRouter>
        <div style={{ maxWidth: "340px", height: "600px" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MapDetailPanel>;

const mockArtists: Artist[] = [
  {
    id: 1,
    name: "Bert Krak",
    instagram_handle: "bertkrak",
    city_name: "New York",
    state_name: "New York",
    country_name: "United States",
    shop_name: "Smith Street Tattoo Parlour",
    is_traveling: false,
    locations: [
      {
        city_name: "New York",
        state_name: "New York",
        country_name: "United States",
        shop_id: 10,
        shop_name: "Smith Street Tattoo Parlour",
        shop_slug: "smith-street-tattoo-parlour",
      },
    ],
  },
  {
    id: 2,
    name: "Eli Quinters",
    instagram_handle: "eli_quinters",
    city_name: "New York",
    state_name: "New York",
    country_name: "United States",
    shop_name: "Smith Street Tattoo Parlour",
    is_traveling: false,
    locations: [
      {
        city_name: "New York",
        state_name: "New York",
        country_name: "United States",
        shop_id: 10,
        shop_name: "Smith Street Tattoo Parlour",
        shop_slug: "smith-street-tattoo-parlour",
      },
    ],
  },
  {
    id: 3,
    name: "Virginia Elwood",
    instagram_handle: "virginiaelwood",
    city_name: "San Francisco",
    state_name: "California",
    country_name: "United States",
    shop_name: "Idle Hand",
    is_traveling: false,
    locations: [
      {
        city_name: "San Francisco",
        state_name: "California",
        country_name: "United States",
        shop_id: 11,
        shop_name: "Idle Hand",
        shop_slug: "idle-hand-sf",
      },
    ],
  },
  {
    id: 4,
    name: "Steve Boltz",
    instagram_handle: "steveboltz",
    city_name: "Philadelphia",
    state_name: "Pennsylvania",
    country_name: "United States",
    is_traveling: false,
    locations: [
      {
        city_name: "Philadelphia",
        state_name: "Pennsylvania",
        country_name: "United States",
      },
    ],
  },
  {
    id: 5,
    name: "Dan Santoro",
    instagram_handle: "dansantoro",
    city_name: "Philadelphia",
    state_name: "Pennsylvania",
    country_name: "United States",
    shop_name: "True Hand",
    is_traveling: false,
    locations: [
      {
        city_name: "Philadelphia",
        state_name: "Pennsylvania",
        country_name: "United States",
        shop_id: 12,
        shop_name: "True Hand",
        shop_slug: "true-hand",
      },
    ],
  },
];

const mockShops = [
  { id: 10, shop_name: "Smith Street Tattoo Parlour", slug: "smith-street" },
  { id: 11, shop_name: "Idle Hand", slug: "idle-hand-sf" },
];

const mockCityDots: CityDot[] = [
  {
    cityName: "New York",
    stateName: "New York",
    countryName: "United States",
    continent: "North America",
    lat: 40.7128,
    lng: -74.006,
    artistCount: 2,
    shopCount: 1,
  },
  {
    cityName: "San Francisco",
    stateName: "California",
    countryName: "United States",
    continent: "North America",
    lat: 37.7749,
    lng: -122.4194,
    artistCount: 1,
    shopCount: 1,
  },
  {
    cityName: "Philadelphia",
    stateName: "Pennsylvania",
    countryName: "United States",
    continent: "North America",
    lat: 39.9526,
    lng: -75.1652,
    artistCount: 2,
    shopCount: 1,
  },
];

export const CityView: Story = {
  args: {
    title: "New York",
    subtitle: "New York, United States",
    variant: "city",
    artists: mockArtists.slice(0, 2),
    shops: [mockShops[0]],
    loading: false,
    onClose: () => {},
  },
};

export const CityViewArtistsOnly: Story = {
  args: {
    title: "Philadelphia",
    subtitle: "Pennsylvania, United States",
    variant: "city",
    artists: mockArtists.slice(3, 5),
    shops: [],
    loading: false,
    onClose: () => {},
  },
};

export const RegionView: Story = {
  args: {
    title: "Northeast US",
    subtitle: "United States",
    variant: "region",
    artists: mockArtists,
    shops: mockShops,
    cityDots: mockCityDots,
    loading: false,
    onClose: () => {},
    onCityClick: () => {},
  },
};

export const Loading: Story = {
  args: {
    title: "New York",
    subtitle: "New York, United States",
    variant: "city",
    artists: [],
    shops: [],
    loading: true,
    onClose: () => {},
  },
};

export const Empty: Story = {
  args: {
    title: "Remote City",
    subtitle: "Somewhere",
    variant: "city",
    artists: [],
    shops: [],
    loading: false,
    onClose: () => {},
  },
};
