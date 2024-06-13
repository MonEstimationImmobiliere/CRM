import type { StoryFn } from "@storybook/vue3";

import SbButton from "../SbButton/SbButton.vue";
import SbTooltip from "./SbTooltip.vue";

export default {
  title: "Component/SbTooltip",
  component: SbTooltip
};

const Template: StoryFn<typeof SbTooltip> = (args) => ({
  components: {
    SbTooltip,
    SbButton
  },
  setup() {
    return { args };
  },
  template: `
  <div style="display: flex; gap: 20px; margin-top: 100px; justify-content: center; align-items: center">
    <SbTooltip v-bind="args" placement="top">
      <SbButton>Top</SbButton>
    </SbTooltip>
    <SbTooltip v-bind="args" placement="right">
      <SbButton>Right</SbButton>
    </SbTooltip>
    <SbTooltip v-bind="args" placement="bottom">
      <SbButton>Bottom</SbButton>
    </SbTooltip>
    <SbTooltip v-bind="args" placement="left">
      <SbButton>Left</SbButton>
    </SbTooltip>
  </div>
  `
});

export const Default = {
  render: Template,

  args: {
    content: "Tooltip content"
  }
};

export const Light = {
  render: Template,

  args: {
    content: "Tooltip content",
    effect: "light"
  }
};

export const ClickTrigger = {
  render: Template,

  args: {
    content: "Tooltip content",
    trigger: "click"
  }
};
