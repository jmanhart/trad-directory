import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Serve the app's /public so wordmark SVGs and other static assets resolve.
  staticDirs: ["../public"],
  async viteFinal(viteConfig) {
    // Stub the Supabase env so lib/supabaseClient (imported transitively by
    // some panels via services/api) constructs instead of throwing. Stories
    // only use pure URL helpers — Storybook never talks to the real database.
    viteConfig.define = {
      ...viteConfig.define,
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        "https://storybook.stub.supabase.co"
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        "storybook-stub-anon-key"
      ),
    };
    return viteConfig;
  },
};

export default config;
