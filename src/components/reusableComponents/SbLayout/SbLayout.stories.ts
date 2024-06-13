import type { StoryFn } from "@storybook/vue3";

import SbLayout from "./SbLayout.vue";

export default {
  title: "Component/SbLayout",
  component: SbLayout
};

const Template: StoryFn<typeof SbLayout> = (args) => ({
  components: {
    SbLayout
  },
  setup() {
    return { args };
  },
  template: `
  <SbLayout v-bind="args">
    <template #header>
      Header
    </template>
    Content
    <template #menu>
      Menu
    </template>
  </SbLayout>
  `
});

export const Default = {
  render: Template,

  args: {}
};
