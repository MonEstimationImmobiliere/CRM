import type { StoryFn } from "@storybook/vue3";

import SbLink from "./SbLink.vue";

export default {
  title: "Component/SbLink",
  component: SbLink
};

const Template: StoryFn<typeof SbLink> = (args) => ({
  components: {
    SbLink
  },
  setup() {
    return { args };
  },
  template: `
    <div>
      <SbLink v-bind="args">Default</SbLink>
      <br>
      <br>
      <SbLink v-bind="args" type="primary">Primary</SbLink>
      <br>
      <br>
      <SbLink v-bind="args" type="success">Success</SbLink>
      <br>
      <br>
      <SbLink v-bind="args" type="warning">Warning</SbLink>
      <br>
      <br>
      <SbLink v-bind="args" type="info">Info</SbLink>
      <br>
      <br>
      <SbLink v-bind="args" type="danger">Danger</SbLink>
    </div>
  `
});

export const Default = {
  render: Template
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
    iconPath: "Element:Back",
    iconPosition: "start"
  }
};

export const WithEndIcon = {
  render: Template,

  args: {
    iconPath: "Element:Right",
    iconPosition: "end"
  }
};

export const Loading = {
  render: Template,

  args: {
    loading: true
  }
};
