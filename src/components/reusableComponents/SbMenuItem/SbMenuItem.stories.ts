import type { StoryFn } from "@storybook/vue3";

import SbMenu from "../SbMenu/SbMenu.vue";
import SbMenuItem from "./SbMenuItem.vue";

export default {
  title: "Component/SbMenuItem",
  component: SbMenuItem
};

const Template: StoryFn<typeof SbMenuItem> = (args) => ({
  components: { SbMenuItem, SbMenu },
  setup() {
    return { args };
  },
  template: `
  <SbMenu>
    <SbMenuItem v-bind="args" icon-path="Element:Document"/>
  </SbMenu>
  `
});

export const Default = {
  render: Template,

  args: {
    label: "Documents"
  }
};

export const Disabled = {
  render: Template,

  args: {
    label: "Documents",
    disabled: true
  }
};

export const Active = {
  render: Template,

  args: {
    label: "Documents",
    active: true
  }
};

export const WithSubtitle = {
  render: Template,

  args: {
    label: "Documents",
    subtitle: "Tous mes documents"
  }
};

export const ActiveWithSubtitle = {
  render: Template,

  args: {
    label: "Documents",
    subtitle: "Tous mes documents",
    active: true
  }
};
