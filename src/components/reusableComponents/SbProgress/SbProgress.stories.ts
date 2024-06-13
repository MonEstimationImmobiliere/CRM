import type { StoryFn } from "@storybook/vue3";

import SbProgress from "./SbProgress.vue";

export default {
  title: "Component/SbProgress",
  component: SbProgress
};

const Template: StoryFn<typeof SbProgress> = (args) => ({
  components: {
    SbProgress
  },
  setup() {
    return { args };
  },
  template: `
    <div class="category-container mt-4">
    <SbProgress v-bind="args"/>
    </div>
  `
});

export const Default = {
  render: Template,

  args: {
    percentage: 70,
    color: "#d23d3d",
    labelValue: "Example label",
    detail: "detail"
  }
};
