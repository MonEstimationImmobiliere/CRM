import type { StoryFn } from "@storybook/vue3";

import SbNetworkErrorPage from "./SbNetworkErrorPage.vue";

export default {
  title: "Pages/SbNetworkErrorPage",
  component: SbNetworkErrorPage
};

const Template: StoryFn<typeof SbNetworkErrorPage> = (args) => ({
  components: {
    SbNetworkErrorPage
  },
  setup() {
    return { args };
  },
  template: `
  <div style="width: 800px;height: 40vh;">
    <SbNetworkErrorPage v-bind="args" />
  </div>
  `
});

export const Default = {
  render: Template,
  args: {
    show: true
  }
};
