import type { StoryFn, StoryObj } from "@storybook/vue3";
import { ref } from "vue";

import SbForm from "../SbForm/SbForm.vue";
import SbFormItem from "../SbFormItem/SbFormItem.vue";
import SbInput from "./SbInput.vue";

export default {
  title: "Component/SbInput",
  component: SbInput
};

const Template: StoryFn<typeof SbInput> = (args) => ({
  components: {
    SbInput
  },
  setup() {
    return { args };
  },
  template: `
    <h2>Input</h2>
    <SbInput v-bind="args" placeholder="Small input" size="small"/>
    <br/>
    <br/>
    <SbInput v-bind="args" placeholder="Default input" size="default"/>
    <br/>
    <br/>
    <SbInput v-bind="args" placeholder="Large input" size="large"/>
    <br/>
    <br/>
    <SbInput v-bind="args" placeholder="Small input" size="small" model-value="Small input with text" />
    <br/>
    <br/>
    <SbInput v-bind="args" placeholder="Default input" size="default" model-value="Default input with text" />
    <br/>
    <br/>
    <SbInput v-bind="args" placeholder="Large input" size="large" model-value="Large input with text" />
    <br/>
    <br/>
    <h2>Textarea</h2>
    <SbInput v-bind="args" type="textarea" placeholder="Small textarea" size="small"/>
    <br/>
    <br/>
    <SbInput v-bind="args" type="textarea" placeholder="Default textarea" size="default"/>
    <br/>
    <br/>
    <SbInput v-bind="args" type="textarea" placeholder="Large textarea" size="large"/>
    <br/>
    <br/>
    <SbInput v-bind="args" type="textarea" placeholder="Small textarea" size="small" model-value="Small textarea with text" />
    <br/>
    <br/>
    <SbInput v-bind="args" type="textarea" placeholder="Default textarea" size="default" model-value="Default textarea with text" />
    <br/>
    <br/>
    <SbInput v-bind="args" type="textarea" placeholder="Large textarea" size="large" model-value="Large textarea with text" />
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

const FormatTemplate = (args) => ({
  components: {
    SbForm,
    SbFormItem,
    SbInput
  },
  setup() {
    const integerModel = ref(481516);
    const floatModel = ref(12233.49056);
    const currencyModel = ref(233445.98);
    return { args, integerModel, floatModel, currencyModel };
  },
  template: `
    <SbForm>
      <SbFormItem label="Format: integer">
        <template #subtitle>
          Model value : {{ integerModel }}
        </template>
        <SbInput v-bind="args" format="integer" v-model="integerModel"/>
      </SbFormItem>
      <SbFormItem label="Format: float">
        <template #subtitle>
          Model value : {{ floatModel }}
        </template>
        <SbInput v-bind="args" format="float" v-model="floatModel"/>
      </SbFormItem>
      <SbFormItem label="Format: currency">
        <template #subtitle>
          Model value : {{ currencyModel }}
        </template>
        <SbInput v-bind="args" format="currency" v-model="currencyModel"/>
      </SbFormItem>
    </SbForm>
  `
});

export const WithFormat: StoryObj<typeof SbInput> = {
  render: FormatTemplate,

  args: {}
};
