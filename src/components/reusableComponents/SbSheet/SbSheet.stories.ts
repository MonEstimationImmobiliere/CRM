import type { StoryFn } from "@storybook/vue3";
import { ref } from "vue";

import SbSheet from "./SbSheet.vue";

export default {
  title: "Component/SbSheet",
  component: SbSheet
};

const Template: StoryFn<typeof SbSheet> = (args) => ({
  components: {
    SbSheet
  },
  setup() {
    const sheetOpen = ref(false);
    const handleMenuItemClick = (menuItemId: string) => {
      alert(`menu item ${menuItemId} clicked`);
    };
    return { args, sheetOpen, handleMenuItemClick };
  },
  template: `
  <div style="padding: 1em">
    <button @click="sheetOpen = !sheetOpen">Toggle</button>
    <div style="width: 400px; height: 700px; border: 1px solid black; border-radius: 8px; background-color: #c3c3c3; position: relative; overflow: hidden">
      <SbSheet :modelValue="sheetOpen" v-bind="args" @menu-item-click="handleMenuItemClick">
        <template #header-title>
          aaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaa avaaaaaaaaaaaaaa aaaaaaaaaaaa aaaaaaaaaaaaaaaaaa
        </template>
      </SbSheet>
    </div>
  </div>
  `
});

export const Default = {
  render: Template,

  args: {}
};

export const WithMenu = {
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
