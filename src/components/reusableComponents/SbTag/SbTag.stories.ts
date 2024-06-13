
import type { Story } from "@storybook/vue3";

import SbTag from "./SbTag.vue";

export default {
  title: "Component/SbTag",
  component: SbTag
};

const Template = (args) => ({
  components: {
    SbTag
  },
  setup() {
    return { args };
  },
  template: `
  <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; max-width: 200px;">
      <SbTag v-bind="args" size="small">Default</SbTag>
      <SbTag v-bind="args" size="default">Default</SbTag>
      <SbTag v-bind="args" size="large">Default</SbTag>
      <SbTag type="primary" v-bind="args" size="small">Primary</SbTag>
      <SbTag type="primary" v-bind="args" size="default">Primary</SbTag>
      <SbTag type="primary" v-bind="args" size="large">Primary</SbTag>
      <SbTag type="success" v-bind="args" size="small">Success</SbTag>
      <SbTag type="success" v-bind="args" size="default">Success</SbTag>
      <SbTag type="success" v-bind="args" size="large">Success</SbTag>
      <SbTag type="info" v-bind="args" size="small">Info</SbTag>
      <SbTag type="info" v-bind="args" size="default">Info</SbTag>
      <SbTag type="info" v-bind="args" size="large">Info</SbTag>
      <SbTag type="warning" v-bind="args" size="small">Warning</SbTag>
      <SbTag type="warning" v-bind="args" size="default">Warning</SbTag>
      <SbTag type="warning" v-bind="args" size="large">Warning</SbTag>
      <SbTag type="danger" v-bind="args" size="small">Danger</SbTag>
      <SbTag type="danger" v-bind="args" size="default">Danger</SbTag>
      <SbTag type="danger" v-bind="args" size="large">Danger</SbTag>
  </div>
  `
});

export const Default: Story<typeof SbTag> = Template.bind({});
Default.args = {};
