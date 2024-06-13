import type { StoryFn } from "@storybook/vue3";

import SbDatePicker from "./SbDatePicker.vue";

export default {
  title: "Component/SbDatePicker",
  component: SbDatePicker
};

const Template: StoryFn<typeof SbDatePicker> = (args) => ({
  components: {
    SbDatePicker
  },
  setup() {
    return { args };
  },
  template: `
    <SbDatePicker v-bind="args" placeholder="Small input" size="small"/>
    <br/>
    <br/>
    <SbDatePicker v-bind="args" placeholder="Default input" size="default"/>
    <br/>
    <br/>
    <SbDatePicker v-bind="args" placeholder="Large input" size="large"/>
    <br/>
    <br/>
    <SbDatePicker v-bind="args" placeholder="Small input" size="small" :model-value="Date.now()" />
    <br/>
    <br/>
    <SbDatePicker v-bind="args" placeholder="Default input" size="default" :model-value="Date.now()" />
    <br/>
    <br/>
    <SbDatePicker v-bind="args" placeholder="Large input" size="large" :model-value="Date.now()" />
  `
});

export const Default = {
  render: Template,

  args: {}
};

export const WithShadow = {
  render: Template,

  args: {
    shadow: true
  }
};

export const Disabled = {
  render: Template,

  args: {
    disabled: true
  }
};
