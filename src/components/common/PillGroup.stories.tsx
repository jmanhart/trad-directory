import type { Meta, StoryObj } from "@storybook/react";
import PillGroup from "./PillGroup";
import ArtistsIcon from "../../assets/icons/artistsIcon";
import ShopsIcon from "../../assets/icons/shopsIcon";

const meta: Meta<typeof PillGroup> = {
  title: "Components/PillGroup",
  component: PillGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PillGroup>;

export const Simple: Story = {
  args: {
    items: [
      { label: "Traditional", count: 42 },
      { label: "Neo-traditional", count: 18 },
      { label: "Japanese", count: 25 },
    ],
  },
};

export const WithTitle: Story = {
  args: {
    title: "Filter by Style",
    items: [
      { label: "Traditional", count: 42 },
      { label: "Neo-traditional", count: 18 },
      { label: "Japanese", count: 25 },
      { label: "Blackwork", count: 12 },
    ],
  },
};

export const WithIcons: Story = {
  args: {
    title: "Browse",
    items: [
      { label: "Artists", count: 150, icon: <ArtistsIcon /> },
      { label: "Shops", count: 45, icon: <ShopsIcon /> },
    ],
  },
};

export const Clickable: Story = {
  args: {
    title: "Categories",
    items: [
      { label: "Traditional", count: 42, onClick: () => alert("Traditional clicked") },
      { label: "Neo-traditional", count: 18, onClick: () => alert("Neo-traditional clicked") },
      { label: "Japanese", count: 25, onClick: () => alert("Japanese clicked") },
    ],
  },
};
