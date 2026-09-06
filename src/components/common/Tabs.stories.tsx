import type { Meta, StoryObj, Decorator } from "@storybook/react";
import { useState } from "react";
import { fn } from "@storybook/test";
import { Tabs, type TabItem } from "./Tabs";

// Tabs is controlled (activeTab + onTabChange). This wrapper holds the state so
// the stories are actually clickable rather than frozen on one tab.
function TabsDemo({ items, initial }: { items: TabItem[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? items[0]?.id);
  return <Tabs items={items} activeTab={active} onTabChange={setActive} />;
}

const surface: Decorator = (Story, ctx) =>
  ctx.parameters.noFrame ? (
    <Story />
  ) : (
    <div style={{ width: 460, background: "#fff", padding: "0 1rem", borderRadius: 8 }}>
      <Story />
    </div>
  );

const withCounts: TabItem[] = [
  { id: "artists", label: "Artists", count: 30 },
  { id: "shops", label: "Shops", count: 7 },
];

const meta = {
  title: "Common/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
  decorators: [surface],
  args: { items: withCounts, activeTab: "artists", onTabChange: fn() },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two tabs with count pills — the map/search results pattern. */
export const Default: Story = { render: () => <TabsDemo items={withCounts} /> };

/** Same, opened on the second tab. */
export const ActiveShops: Story = {
  render: () => <TabsDemo items={withCounts} initial="shops" />,
};

/** Plain labels, no count pills. */
export const NoCounts: Story = {
  render: () => (
    <TabsDemo
      items={[
        { id: "artists", label: "Artists" },
        { id: "shops", label: "Shops" },
      ]}
    />
  ),
};

/** Notification-style badges (values over 99 show "99+"). */
export const WithBadge: Story = {
  render: () => (
    <TabsDemo
      items={[
        { id: "submissions", label: "Submissions", badge: 5 },
        { id: "bugs", label: "Bugs", badge: 120 },
      ]}
    />
  ),
};

/** A disabled tab can't be selected. */
export const WithDisabled: Story = {
  render: () => (
    <TabsDemo
      items={[
        { id: "artists", label: "Artists", count: 30 },
        { id: "shops", label: "Shops", count: 7 },
        { id: "cities", label: "Cities", disabled: true },
      ]}
    />
  ),
};

/** Many tabs with large counts — the admin data-table pattern. */
export const Many: Story = {
  render: () => (
    <TabsDemo
      items={[
        { id: "artists", label: "Artists", count: 874 },
        { id: "shops", label: "Shops", count: 142 },
        { id: "cities", label: "Cities", count: 520 },
        { id: "countries", label: "Countries", count: 60 },
      ]}
    />
  ),
};

/** All permutations at a glance. */
export const All: Story = {
  parameters: { noFrame: true, layout: "padded" },
  render: () => {
    const cell = (label: string, items: TabItem[], initial?: string) => (
      <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ font: "600 12px/1 system-ui", color: "#6b7280" }}>{label}</span>
        <div style={{ width: 460, background: "#fff", padding: "0 1rem", borderRadius: 8 }}>
          <TabsDemo items={items} initial={initial} />
        </div>
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24 }}>
        {cell("With counts", withCounts)}
        {cell("Active: Shops", withCounts, "shops")}
        {cell("No counts", [
          { id: "artists", label: "Artists" },
          { id: "shops", label: "Shops" },
        ])}
        {cell("Badges", [
          { id: "submissions", label: "Submissions", badge: 5 },
          { id: "bugs", label: "Bugs", badge: 120 },
        ])}
        {cell("Disabled tab", [
          { id: "artists", label: "Artists", count: 30 },
          { id: "shops", label: "Shops", count: 7 },
          { id: "cities", label: "Cities", disabled: true },
        ])}
        {cell("Many", [
          { id: "artists", label: "Artists", count: 874 },
          { id: "shops", label: "Shops", count: 142 },
          { id: "cities", label: "Cities", count: 520 },
          { id: "countries", label: "Countries", count: 60 },
        ])}
      </div>
    );
  },
};
