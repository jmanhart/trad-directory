import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Tabs, TabItem } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "A tab navigation component for organizing content into multiple sections. Supports active states, disabled tabs, and horizontal scrolling for many tabs.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const basicTabs: TabItem[] = [
  { id: "tab1", label: "Tab 1" },
  { id: "tab2", label: "Tab 2" },
  { id: "tab3", label: "Tab 3" },
];

export const Basic: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("tab1");
    return (
      <div>
        <Tabs items={basicTabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ padding: "1rem", color: "var(--color-text-primary)" }}>
          Active tab: {activeTab}
        </div>
      </div>
    );
  },
};

export const WithDisabledTabs: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("tab1");
    const tabs: TabItem[] = [
      { id: "tab1", label: "Active Tab" },
      { id: "tab2", label: "Disabled Tab", disabled: true },
      { id: "tab3", label: "Another Tab" },
      { id: "tab4", label: "Also Disabled", disabled: true },
    ];
    return (
      <div>
        <Tabs items={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ padding: "1rem", color: "var(--color-text-primary)" }}>
          Active tab: {activeTab}
        </div>
      </div>
    );
  },
};

export const ManyTabs: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("tab1");
    const tabs: TabItem[] = [
      { id: "tab1", label: "First Tab" },
      { id: "tab2", label: "Second Tab" },
      { id: "tab3", label: "Third Tab" },
      { id: "tab4", label: "Fourth Tab" },
      { id: "tab5", label: "Fifth Tab" },
      { id: "tab6", label: "Sixth Tab" },
      { id: "tab7", label: "Seventh Tab" },
      { id: "tab8", label: "Eighth Tab" },
      { id: "tab9", label: "Ninth Tab" },
      { id: "tab10", label: "Tenth Tab" },
    ];
    return (
      <div>
        <Tabs items={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ padding: "1rem", color: "var(--color-text-primary)" }}>
          Active tab: {activeTab}
        </div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "1rem" }}>
          Scroll horizontally to see all tabs
        </p>
      </div>
    );
  },
};

export const AdminExample: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("artists");
    const tabs: TabItem[] = [
      { id: "artists", label: "Artists" },
      { id: "shops", label: "Shops" },
      { id: "cities", label: "Cities", disabled: true },
      { id: "countries", label: "Countries", disabled: true },
      { id: "states", label: "States", disabled: true },
      { id: "bugs", label: "BUGS" },
      { id: "submissions", label: "SUBMISSIONS" },
    ];
    return (
      <div>
        <Tabs items={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ padding: "1.5rem", backgroundColor: "var(--color-surface)", borderRadius: "8px", marginTop: "1rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "var(--color-text-primary)" }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Content
          </h3>
          <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
            This is the content area for the {activeTab} tab.
          </p>
        </div>
      </div>
    );
  },
};

export const WithContent: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("overview");
    const tabs: TabItem[] = [
      { id: "overview", label: "Overview" },
      { id: "details", label: "Details" },
      { id: "settings", label: "Settings" },
    ];
    
    const content = {
      overview: "This is the overview content. It provides a summary of the main information.",
      details: "This is the details content. It contains more specific information about the topic.",
      settings: "This is the settings content. Here you can configure various options.",
    };
    
    return (
      <div>
        <Tabs items={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ padding: "1.5rem", backgroundColor: "var(--color-surface)", borderRadius: "8px", marginTop: "1rem", minHeight: "200px" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "var(--color-text-primary)" }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p style={{ color: "var(--color-text-secondary)", margin: 0, lineHeight: "1.6" }}>
            {content[activeTab as keyof typeof content]}
          </p>
        </div>
      </div>
    );
  },
};
