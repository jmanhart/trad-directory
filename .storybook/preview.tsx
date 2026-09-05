import React from "react";
import type { Preview } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

// Load the app's real design tokens + global styles so stories render
// exactly like production (fonts, colors, resets).
import "../src/styles/variables.css";
import "../src/styles/globals.css";

const preview: Preview = {
  // Living docs: every story gets an auto-generated "Docs" page from its
  // argTypes + JSDoc. Component-specific docs stay in sync with the code.
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "app",
      values: [
        { name: "app", value: "#fff4f4" },
        { name: "surface", value: "#ffffff" },
        { name: "ink", value: "#141414" },
      ],
    },
  },
  decorators: [
    // Components that render <Link> need a router in context.
    Story => (
      <MemoryRouter>
        <div style={{ padding: "1.5rem" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default preview;
