import { StoryFn } from "@storybook/vue3";
import { ref } from "vue";

import SbButton from "../SbButton/SbButton.vue";
import SbDrawer from "./SbDrawer.vue";

export default {
  title: "Component/SbDrawer",
  component: SbDrawer
};

const Template: StoryFn<typeof SbDrawer> = (args) => ({
  components: {
    SbDrawer,
    SbButton
  },
  setup() {
    return {
      args,
      drawer: ref(false)
    };
  },
  template: `
    <div style="width: 500px">
      <SbButton v-bind="args"  @click="drawer = true">
        open
      </SbButton>
      <SbDrawer v-bind="args" v-model="drawer">
        <span>CONTENT</span>
      </SbDrawer>
    </div>
  `
});

export const Default = {
  render: Template,

  args: {
    header: "TITLE"
  }
};