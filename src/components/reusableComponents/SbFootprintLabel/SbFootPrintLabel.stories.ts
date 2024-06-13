import type { StoryFn } from "@storybook/vue3";

import SbFootprintLabel from "./SbFootprintLabel.vue";

export default {
  title: "Component/SbFootprintLabel",
  component: SbFootprintLabel
};

const Template: StoryFn<typeof SbFootprintLabel> = (args) => ({
  components: {
    SbFootprintLabel
  },
  setup() {
    return { args };
  },
  template: `
  <div style="width: 400px;background:#ffffff">
      <SbFootprintLabel v-bind="args"/>
  </div>
  `
});

export const Default = {
  render: Template,

  args: {
    score: "A"
  }
};
