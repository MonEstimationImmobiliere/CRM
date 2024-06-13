import type { Story } from "@storybook/vue3";
import { ref } from "vue";

import SbCheckbox from "./SbCheckbox.vue";
import SbCheckboxGroup from "./SbCheckboxGroup.vue";

export default {
  title: "Component/SbCheckbox",
  component: SbCheckbox
};

const Template: Story<typeof SbCheckbox> = (args) => ({
  components: {
    SbCheckbox,
    SbCheckboxGroup
  },
  setup() {
    const models1 = ref([]);
    const models2 = ref(["Small checkbox", "Default checkbox", "Large checkbox"]);
    return {
      args,
      models1,
      models2
    };
  },
  template: `
    <SbCheckboxGroup v-model="models1" class="flex-column">
      <SbCheckbox v-bind="args" label="Small checkbox" size="small" />
      <SbCheckbox v-bind="args" label="Default checkbox" size="default"/>
      <SbCheckbox v-bind="args" label="Large checkbox" size="large"/>
    </SbCheckboxGroup>
    <hr/>
    <SbCheckboxGroup v-model="models2" class="flex-column">
      <SbCheckbox v-bind="args" label="Small checkbox" size="small" />
      <SbCheckbox v-bind="args" label="Default checkbox" size="default" />
      <SbCheckbox v-bind="args" label="Large checkbox" size="large" />
    </SbCheckboxGroup>
    <hr/>
    <SbCheckbox v-bind="args" checkbox-position="right" label="Reversed checkbox" />
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

const WrappedTemplate: Story<typeof SbCheckbox> = (args) => ({
  components: {
    SbCheckbox,
    SbCheckboxGroup
  },
  setup() {
    return { args };
  },
  template: `
    <SbCheckboxGroup v-bind="args">
      <SbCheckbox label="Checkbox 1" />
      <SbCheckbox label="Checkbox 2" />
    </SbCheckboxGroup>
  `
});

export const Wrapped = WrappedTemplate.bind({});
Wrapped.args = {
  wrapped: true
};

