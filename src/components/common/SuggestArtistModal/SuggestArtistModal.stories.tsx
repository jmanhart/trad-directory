import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ToastProvider } from "../Toast";
import { SuggestArtistModal } from "./index";

const meta: Meta<typeof SuggestArtistModal> = {
  title: "Patterns/Forms/SuggestArtistModal",
  component: SuggestArtistModal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
  },
  decorators: [
    Story => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SuggestArtistModal>;

const SuggestWrapper = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <SuggestArtistModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
  );
};

export const AddArtistForm: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <SuggestWrapper />,
};
