import type { StoryFn } from "@storybook/vue3";

import SbAddZone from "./SbAddZone.vue";

export default {
  title: "Component/SbAddZone",
  component: SbAddZone
};

const Template: StoryFn<typeof SbAddZone> = (args) => ({
  components: {
    SbAddZone
  },
  setup() {
    return { args };
  },
  template: `
    <div style="width: 500px">
      <SbAddZone v-bind="args">Create beautiful content</SbAddZone>
    </div>
    `
});

export const Default = {
  render: Template,
  args: {
    onClick: () => alert("Clicked!")
  }
};

export const Disabled = {
  render: Template,
  args: {
    onClick: () => alert("Clicked!"),
    disabled: true
  }
};
