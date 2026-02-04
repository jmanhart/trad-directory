import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ToastProvider } from "../Toast";
import { ReportIssueModal } from "./index";
import type { ArtistData } from "./types";

const meta: Meta<typeof ReportIssueModal> = {
  title: "Patterns/Forms/ReportIssueModal",
  component: ReportIssueModal,
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
type Story = StoryObj<typeof ReportIssueModal>;

const mockArtistData: ArtistData = {
  id: 123,
  name: "John Doe",
  instagram_handle: "johndoe_tattoo",
  city_name: "Los Angeles",
  state_name: "California",
  country_name: "United States",
  shop_name: "Ink Shop",
  shop_instagram_handle: "inkshop",
};

const ReportArtistWrapper = (
  props: Partial<React.ComponentProps<typeof ReportIssueModal>>
) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <ReportIssueModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      entityType="artist"
      entityId="123"
      pageUrl="https://example.com/artist/123"
      entityData={mockArtistData}
      {...props}
    />
  );
};

export const ReportBugForm: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <ReportArtistWrapper />,
};

export const ReportBugFormMinimal: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <ReportArtistWrapper
      entityData={{
        id: 456,
        name: "Minimal Artist",
        instagram_handle: null,
        city_name: undefined,
        state_name: undefined,
        country_name: undefined,
      }}
    />
  ),
};
