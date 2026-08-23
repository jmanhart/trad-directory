import type { Meta, StoryObj } from "@storybook/react";

// The production wordmark SVGs shipped in /public, served via staticDirs.
const meta = {
  title: "Brand/Wordmark",
  parameters: { layout: "centered", backgrounds: { default: "surface" } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Trad: Story = {
  render: () => <img src="/TRAD-NEW.svg" alt="TRAD" style={{ height: 60 }} />,
};

export const Directory: Story = {
  render: () => (
    <img src="/DIRECTORY-NEW.svg" alt="DIRECTORY" style={{ height: 60 }} />
  ),
};

export const Lockup: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <img src="/TRAD-NEW.svg" alt="TRAD" style={{ height: 52 }} />
      <img src="/DIRECTORY-NEW.svg" alt="DIRECTORY" style={{ height: 52 }} />
    </div>
  ),
};
