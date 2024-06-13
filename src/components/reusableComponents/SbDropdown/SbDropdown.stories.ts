import type { StoryFn } from "@storybook/vue3";

import SbDropdown from "./SbDropdown.vue";

export default {
  title: "Component/SbDropdown",
  component: SbDropdown
};

const Template: StoryFn<typeof SbDropdown> = (args) => ({
  components: {
    SbDropdown
  },
  setup() {
    const handleMenuItemClick = (menuItemId: string) => {
      alert(`menu item ${menuItemId} clicked`);
    };
    return { args, handleMenuItemClick };
  },
  template: `
      <div>
        <SbDropdown v-bind="args" @menuItemClick="handleMenuItemClick" />
      </div>
      `
});

export const Default = {
  render: Template,

  args: {
    dropdownMenuItems: [
      {
        dropdownMenuItemId: "shareTicket",
        dropdownMenuItemLabel: "Partager"
      },
      {
        dropdownMenuItemId: "showOriginalTicket",
        dropdownMenuItemLabel: "Version originale"
      },
      {
        dropdownMenuItemId: "saveTicket",
        dropdownMenuItemLabel: "Sauvegarder le ticket"
      },
      {
        dropdownMenuItemId: "deleteTicket",
        dropdownMenuItemLabel: "Supprimer le ticket"
      }
    ]
  }
};
