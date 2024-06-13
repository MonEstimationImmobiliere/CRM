
import type { StoryFn } from "@storybook/vue3";
import { ref } from "vue";

import SbEditorInput from "./SbEditorInput.vue";

export default {
  title: "Component/SbEditorInput",
  component: SbEditorInput
};

const Template: StoryFn<typeof SbEditorInput> = (args) => ({
  components: {
    SbEditorInput
  },
  setup() {
    return {
      args,
      model: ref("")
    };
  },
  template: `
    <h2>Editor Input</h2>
    <SbEditorInput v-model="model" v-bind="args"/>
  `
});

export const Default = Template.bind({});
Default.args = {};
