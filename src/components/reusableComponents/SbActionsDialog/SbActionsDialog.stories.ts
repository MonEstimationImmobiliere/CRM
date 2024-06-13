import type { Story } from "@storybook/vue3";
import { ref } from "vue";

import SbButton from "../SbButton/SbButton.vue";
import SbActionsDialog from "./SbActionsDialog.vue";

export default {
  title: "Component/SbActionsDialog",
  component: SbActionsDialog
};

const Template: Story<typeof SbActionsDialog> = (args) => ({
  components: { SbActionsDialog, SbButton },
  mounted() {
    this.isDialogOpen = true;
  },
  setup() {
    const isDialogOpen = ref(false);

    const handleAction = ({ action }) => {
      isDialogOpen.value = false;
      alert(`Clicked "${action.title}" action`);
    };

    return { args, isDialogOpen, handleAction };
  },
  template: `
    <SbActionsDialog v-model="isDialogOpen" v-bind="args" @action="handleAction"/>
    <SbButton @click="isDialogOpen = true">Open actions dialog</SbButton>
  `
});

export const Default = Template.bind({});
Default.args = {
  title: "My actions",
  actions: [
    {
      title: "Do this",
      type: "primary"
    },
    {
      title: "Do that"
    },
    {
      title: "Or do this...",
      type: "danger"
    }
  ]
};
