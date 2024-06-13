import type { StoryFn } from "@storybook/vue3";

import SbButton from "./SbButton.vue";

export default {
  title: "Component/SbButton",
  component: SbButton
};

const Template: StoryFn<typeof SbButton> = (args) => ({
  components: {
    SbButton
  },
  setup() {
    return { args };
  },
  template: `
  <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; max-width: 450px;">
      <SbButton class="ml-0" text v-bind="args" size="small">Default</SbButton>
      <SbButton class="ml-0" v-bind="args" size="small">Default</SbButton>
      <SbButton class="ml-0" v-bind="args" size="default">Default</SbButton>
      <SbButton class="ml-0" v-bind="args" size="large">Default</SbButton>
      <SbButton class="ml-0" text type="primary" v-bind="args" size="small">Primary</SbButton>
      <SbButton class="ml-0" type="primary" v-bind="args" size="small">Primary</SbButton>
      <SbButton class="ml-0" type="primary" v-bind="args" size="default">Primary</SbButton>
      <SbButton class="ml-0" type="primary" v-bind="args" size="large">Primary</SbButton>
      <SbButton class="ml-0" text type="success" v-bind="args" size="small">Success</SbButton>
      <SbButton class="ml-0" type="success" v-bind="args" size="small">Success</SbButton>
      <SbButton class="ml-0" type="success" v-bind="args" size="default">Success</SbButton>
      <SbButton class="ml-0" type="success" v-bind="args" size="large">Success</SbButton>
      <SbButton class="ml-0" text type="info" v-bind="args" size="small">Info</SbButton>
      <SbButton class="ml-0" type="info" v-bind="args" size="small">Info</SbButton>
      <SbButton class="ml-0" type="info" v-bind="args" size="default">Info</SbButton>
      <SbButton class="ml-0" type="info" v-bind="args" size="large">Info</SbButton>
      <SbButton class="ml-0" text type="warning" v-bind="args" size="small">Warning</SbButton>
      <SbButton class="ml-0" type="warning" v-bind="args" size="small">Warning</SbButton>
      <SbButton class="ml-0" type="warning" v-bind="args" size="default">Warning</SbButton>
      <SbButton class="ml-0" type="warning" v-bind="args" size="large">Warning</SbButton>
      <SbButton class="ml-0" text type="danger" v-bind="args" size="small">Danger</SbButton>
      <SbButton class="ml-0" type="danger" v-bind="args" size="small">Danger</SbButton>
      <SbButton class="ml-0" type="danger" v-bind="args" size="default">Danger</SbButton>
      <SbButton class="ml-0" type="danger" v-bind="args" size="large">Danger</SbButton>
  </div>
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

export const WithStartIcon = {
  render: Template,

  args: {
    iconPath: "Element:Download",
    iconPosition: "start"
  }
};

export const WithEndIcon = {
  render: Template,

  args: {
    iconPath: "Element:Download",
    iconPosition: "end"
  }
};

export const Loading = {
  render: Template,

  args: {
    loading: true
  }
};

const TemplateSquared: StoryFn<typeof SbButton> = (args) => ({
  components: {
    SbButton
  },
  setup() {
    return { args };
  },
  template: `
    <SbButton squared icon-path="Element:CloseBold" text />
    <SbButton squared icon-path="Element:CloseBold" />
    <SbButton squared icon-path="Element:CloseBold" type="primary" />
    <SbButton squared icon-path="Element:CloseBold" type="success" />
    <SbButton squared icon-path="Element:CloseBold" type="info" />
    <SbButton squared icon-path="Element:CloseBold" type="warning" />
    <SbButton squared icon-path="Element:CloseBold" type="danger" />
  `
});

export const Squared = {
  render: TemplateSquared,
  args: {}
};
