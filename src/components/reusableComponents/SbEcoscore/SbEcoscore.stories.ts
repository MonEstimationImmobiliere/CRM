import type { StoryFn } from "@storybook/vue3";

import SbEcoscore from "./SbEcoscore.vue";

export default {
  title: "component/SbEcoscore",
  component: SbEcoscore
};

const Template: StoryFn<typeof SbEcoscore> = (args) => ({
  components: {
    SbEcoscore
  },
  setup() {
    return { args };
  },
  template: `
  <div>
    <SbEcoscore v-bind="args" />
  </div>
  `
});

export const Default = {
  render: Template,

  args: {
    modelValue: "A"
  }
};
