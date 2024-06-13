import type { StoryFn } from "@storybook/vue3";
import { ref } from "vue";

import SbRadio from "./SbRadio.vue";
import SbRadioButton from "./SbRadioButton.vue";
import SbRadioGroup from "./SbRadioGroup.vue";

export default {
  title: "Component/SbRadio",
  component: SbRadio
};

const Template: StoryFn<typeof SbRadio> = (args) => ({
  components: {
    SbRadio,
    SbRadioGroup
  },
  setup() {
    return {
      args,
      model: ref("Small radio")
    };
  },
  template: `
    <SbRadioGroup v-model="model" class="flex-column">
      <SbRadio v-bind="args" label="Small radio" size="small"/>
      <br/>
      <SbRadio v-bind="args" label="Default radio" size="default"/>
      <br/>
      <SbRadio v-bind="args" label="Large radio" size="large"/>
    </SbRadioGroup>
  `
});

export const Default = Template.bind({});
Default.args = {
};

export const WithShadow = Template.bind({});
WithShadow.args = {
  shadow: true
};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true
};

const Button: StoryFn<typeof SbRadioButton> = (args) => ({
  components: {
    SbRadioButton,
    SbRadioGroup
  },
  setup() {
    return {
      args,
      model: ref("Option 1")
    };
  },
  template: `
    <SbRadioGroup v-model="model" :radio-button="true">
      <SbRadioButton v-bind="args" label="Option 1" size="small" />
      <br/>
      <SbRadioButton v-bind="args" label="Option 2" size="small" />
      <br/>
      <SbRadioButton v-bind="args" label="Option 3" size="small" />
    </SbRadioGroup>
    <br/>
    <SbRadioGroup v-model="model" :radio-button="true">
      <SbRadioButton v-bind="args" label="Option 1" size="default" />
      <br/>
      <SbRadioButton v-bind="args" label="Option 2" size="default" />
      <br/>
      <SbRadioButton v-bind="args" label="Option 3" size="default" />
    </SbRadioGroup>
    <br/>
    <SbRadioGroup v-model="model" :radio-button="true">
      <SbRadioButton v-bind="args" label="Option 1" size="large" />
      <br/>
      <SbRadioButton v-bind="args" label="Option 2" size="large" />
      <br/>
      <SbRadioButton v-bind="args" label="Option 3" size="large" />
    </SbRadioGroup>
  `
});

export const RadioButton = Button.bind({});
RadioButton.args = {
};

