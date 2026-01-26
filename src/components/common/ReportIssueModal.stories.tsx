import type { Meta, StoryObj } from "@storybook/react";
import ReportIssueModal from "./ReportIssueModal";
import { useState } from "react";

const meta: Meta<typeof ReportIssueModal> = {
  title: "Patterns/Forms",
  component: ReportIssueModal,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ReportIssueModal>;

// Wrapper component to control modal state
const ModalWrapper = ({ mode, entityData, ...props }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <ReportIssueModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      mode={mode}
      entityData={entityData}
      entityType="artist"
      entityId="123"
      pageUrl="https://example.com/artist/123"
      {...props}
    />
  );
};

const mockArtistData = {
  id: 123,
  name: "John Doe",
  instagram_handle: "johndoe_tattoo",
  city_name: "Los Angeles",
  state_name: "California",
  country_name: "United States",
  shop_name: "Ink Shop",
  shop_instagram_handle: "inkshop",
};

export const AddArtistForm: Story = {
  render: () => <ModalWrapper mode="new_artist" />,
};

export const ReportBugForm: Story = {
  render: () => <ModalWrapper mode="report" entityData={mockArtistData} />,
};

export const ReportBugFormMinimal: Story = {
  render: () => (
    <ModalWrapper
      mode="report"
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
