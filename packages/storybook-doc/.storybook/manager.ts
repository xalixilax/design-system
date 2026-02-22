import { defaultConfig } from "storybook-addon-tag-badges";
// .storybook/manager.ts
import { addons } from "storybook/manager-api";

addons.setConfig({
  tagBadges: [...defaultConfig],
});
