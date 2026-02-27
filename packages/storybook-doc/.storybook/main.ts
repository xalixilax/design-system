import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    { titlePrefix: "Client Web", directory: "../../../clients/web/src" },
    { titlePrefix: "Design System", directory: "../../design-system/src" },
  ],
  addons: [
    "storybook-addon-pseudo-states",
    "storybook-addon-tag-badges",
    "@storybook/addon-themes",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: (config) => {
    config.server = {
      ...config.server,
      host: true,
      allowedHosts: true,
    };
    return config;
  },
};

// biome-ignore lint/style/noDefaultExport: Required by Storybook
export default config;
