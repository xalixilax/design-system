import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import "@ui/styles/global.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
};

export const decorators = [
  withThemeByClassName({
    themes: {
      light: "",
      dark: "dark",
    },
    defaultTheme: "light",
  }),
  (Story) => (
    <div className="flex flex-col  items-center justify-center h-full p-8">
      <Story />
    </div>
  ),
];

// biome-ignore lint/style/noDefaultExport: Required by Storybook
export default preview;
