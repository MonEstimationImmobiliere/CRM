import type { StoryFn } from "@storybook/vue3";

import SbForm from "../SbForm/SbForm.vue";
import SbFormItem from "../SbFormItem/SbFormItem.vue";
import SbInput from "../SbInput/SbInput.vue";

export default {
  title: "Component/SbFormItem",
  component: SbInput
};

const Template: StoryFn<typeof SbFormItem> = (args) => ({
  components: {
    SbInput,
    SbForm,
    SbFormItem
  },
  setup() {
    return { args };
  },
  template: `
    <SbForm>
      <SbFormItem label="Small form item" size="small" v-bind="args">
        <SbInput placeholder="An input in a small form item"/>
      </SbFormItem>
      <SbFormItem label="Default form item" v-bind="args">
        <SbInput placeholder="An input in a default form item"/>
      </SbFormItem>
      <SbFormItem label="Large form item" size="large" v-bind="args">
        <SbInput placeholder="An input in a large form item"/>
      </SbFormItem>
    </SbForm>
  `
});

export const Default = {
  render: Template,
  args: {}
};

export const WithSubtitle = {
  render: Template,

  args: {
    subtitle: "I can put some subtitle here to act as a helper"
  }
};
