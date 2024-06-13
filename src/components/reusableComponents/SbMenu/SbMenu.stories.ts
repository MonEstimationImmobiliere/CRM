import type { StoryFn } from "@storybook/vue3";

import menuLogo from "../../assets/menu-logo.png";
import SbMenuItem from "../SbMenuItem/SbMenuItem.vue";
import SbMenuItemSeparator from "../SbMenuItem/SbMenuItemSeparator.vue";
import SbMenu from "./SbMenu.vue";

export default {
  title: "Component/SbMenu",
  component: SbMenu
};

const Template: StoryFn<typeof SbMenu> = (args) => ({
  components: {
    SbMenu,
    SbMenuItem,
    SbMenuItemSeparator
  },
  setup() {
    return { args, menuLogo };
  },
  template: `
  <div style="height: 100vh; width: 250px;">
    <SbMenu>
      <template #logo>
        <img :src="menuLogo" width="150" />
      </template>
      <SbMenuItemSeparator />
      <SbMenuItem label="Tickets" icon-path="Element:Document" />
      <SbMenuItem label="Statistiques" icon-path="Element:Histogram" />
    </SbMenu>
  </div>
  `
});

export const Default = {
  render: Template,

  args: {}
};
