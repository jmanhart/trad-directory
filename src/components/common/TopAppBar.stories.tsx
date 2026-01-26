import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import TopAppBar from "./TopAppBar";

const meta: Meta<typeof TopAppBar> = {
  title: "Components/TopAppBar",
  component: TopAppBar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TopAppBar>;

export const HomePage: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export const InternalPage: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/artists"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
