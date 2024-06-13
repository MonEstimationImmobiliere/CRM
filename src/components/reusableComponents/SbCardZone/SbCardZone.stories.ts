import type { StoryFn } from "@storybook/vue3";

import SbCardZone from "./SbCardZone.vue";

export default {
  title: "Component/SbCardZone",
  component: SbCardZone
};

const Template: StoryFn<typeof SbCardZone> = (args) => ({
  components: {
    SbCardZone
  },
  setup() {
    return { args };
  },
  template: `
    <div style="width: 500px">
      <SbCardZone v-bind="args">A cool add zone<br/>where stuff can be put in</SbCardZone>
    </div>
    `
});

export const Default = {
  render: Template,

  args: {}
};

export const Disabled = {
  render: Template,

  args: {
    disabled: true
  }
};

export const Squared = {
  render: Template,

  args: {
    squared: true
  }
};

export const Hoverable = {
  render: Template,

  args: {
    hoverable: true
  }
};

export const Clickable = {
  render: Template,

  args: {
    onClick: () => alert("Clicked!")
  }
};
