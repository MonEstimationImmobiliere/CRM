import type { StoryFn } from "@storybook/vue3";

import SbImageUploader from "./SbImageUploader.vue";
export default {
  title: "Component/SbImageUploader",
  component: SbImageUploader
};

const Template: StoryFn<typeof SbImageUploader> = (args) => ({
  components: {
    SbImageUploader
  },
  setup() {
    return { args };
  },
  template: `
    <div style="width: 400px;">
      <SbImageUploader :limit="null" v-bind="args" squared />
    </div>
    `
});

export const Default = Template.bind({});
Default.args = {
  accept: "image/jpeg, image/jpg, image/png"
};

