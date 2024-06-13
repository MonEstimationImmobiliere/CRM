import type { StoryFn } from "@storybook/vue3";

import SbMobileBottomMenu from "./SbMobileBottomMenu.vue";

export default {
  title: "Component/SbMobileBottomMenu",
  component: SbMobileBottomMenu
};

const Template: StoryFn<typeof SbMobileBottomMenu> = (args) => ({
  components: {
    SbMobileBottomMenu
  },
  setup() {
    return { args, menuItems: [
      {
        iconColor: "#757DE9",
        iconPath: "Custom:Home",
        label: "Accueil",
        path: "/"
      },
      {
        iconColor: "#2DA9EB",
        iconPath: "Custom:Receipts",
        label: "Tickets",
        name: "ReceiptsList",
        path: "/"
      },
      {
        iconColor: "#FF9700",
        iconPath: "Custom:LoyaltyCard",
        label: "Fidélités",
        name: "userLoyaltyCardsList",
        path: "/"
      }
    ] };
  },
  template: `
    <SbMobileBottomMenu
      :menu-items="menuItems"
      :is-user-logged-in="true"
      @more-icon-click="console.log('more-icon-click')"
    />`
});

export const Default = {
  render: Template,

  args: {}
};
