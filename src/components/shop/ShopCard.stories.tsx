import type { Meta, StoryObj } from "@storybook/react";
import ShopCard from "./ShopCard";

const meta: Meta<typeof ShopCard> = {
  title: "Components/ShopCard",
  component: ShopCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ShopCard>;

const mockShop = {
  id: 1,
  name: "Ink Shop",
  city_name: "Los Angeles",
  state_name: "California",
  country_name: "United States",
};

export const Default: Story = {
  args: {
    shop: mockShop,
  },
};

export const International: Story = {
  args: {
    shop: {
      id: 2,
      name: "Tokyo Ink Studio",
      city_name: "Tokyo",
      state_name: undefined,
      country_name: "Japan",
    },
  },
};

export const Minimal: Story = {
  args: {
    shop: {
      id: 3,
      name: "Local Shop",
    },
  },
};

export const Grid: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
      <ShopCard shop={mockShop} />
      <ShopCard shop={{ ...mockShop, name: "Neo Traditional Studio", city_name: "New York", state_name: "New York" }} />
      <ShopCard shop={{ ...mockShop, name: "European Ink", city_name: "London", state_name: undefined, country_name: "United Kingdom" }} />
      <ShopCard shop={{ id: 4, name: "Minimal Shop" }} />
    </div>
  ),
};
