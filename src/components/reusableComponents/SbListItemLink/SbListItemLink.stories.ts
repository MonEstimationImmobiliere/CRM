import type { StoryFn } from "@storybook/vue3";

import SbListItemLink from "./SbListItemLink.vue";

export default {
  title: "Component/SbListItemLink",
  component: SbListItemLink
};

const Template: StoryFn<typeof SbListItemLink> = (args) => ({
  components: {
    SbListItemLink
  },
  setup() {
    return { args };
  },
  template: `
  <div style="width: 400px;">
      <SbListItemLink v-bind="args"/>
  </div>
  `
});

export const Default = {
  render: Template,

  args: {
    title: "Google",
    text: "this is a google link",
    href: "https://www.google.com"
  }
};
