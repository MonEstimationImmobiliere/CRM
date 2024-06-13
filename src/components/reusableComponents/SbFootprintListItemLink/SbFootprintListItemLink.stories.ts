import type { StoryFn } from "@storybook/vue3";

import SbFootprintListItemLink from "./SbFootprintListItemLink.vue";

export default {
  title: "Component/SbFootprintListItemLink",
  component: SbFootprintListItemLink
};

const Template: StoryFn<typeof SbFootprintListItemLink> = (args) => ({
  components: {
    SbFootprintListItemLink
  },
  setup() {
    return { args };
  },
  template: `
  <div style="width: 400px;background:#ffffff">
      <SbFootprintListItemLink v-bind="args"/>
  </div>
  `
});

export const Default = {
  render: Template,

  args: {
    footprint: {
      score: "A",
      a: 18,
      b: 0,
      c: 0,
      d: 22
    }
  }
};
