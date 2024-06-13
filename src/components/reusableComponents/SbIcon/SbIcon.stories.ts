import type { StoryFn } from "@storybook/vue3";

import { customIcons } from "./custom/icons";
import * as elementIcons from "./element/icons";
import SbIcon from "./SbIcon.vue";

export default {
  title: "Component/SbIcon",
  component: SbIcon
};

const Template: StoryFn<typeof SbIcon> = (args) => ({
  components: {
    SbIcon
  },
  setup() {
    return {
      args
    };
  },
  template: `
    <span style="display: flex; align-items: center; gap: 10px">
      <SbIcon v-bind="args" icon-path="Element:CloseBold" /> Element icon ("CloseBold")
    </span>
    <br/>
    <span style="display: flex; align-items: center; gap: 10px">
      <SbIcon v-bind="args" icon-path="Element:CloseBold" :icon-size="30" /> Element icon (CloseBold, 30px)
    </span>
    <br/>
    <span style="display: flex; align-items: center; gap: 10px">
      <SbIcon v-bind="args" icon-path="Element:CloseBold" :icon-size="30" icon-color="var(--el-color-danger)"/> Element icon (CloseBold, 30px, var(--el-color-danger))
    </span>
  `
});

export const Default = {
  render: Template,

  args: {}
};

const AllIconsTemplate: StoryFn<typeof SbIcon> = (args) => ({
  components: {
    SbIcon
  },
  setup() {
    return {
      args
    };
  },
  template: `
    <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px;">
      <template v-for="iconPath in args.iconsPaths">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: space-around; width: 100%; border-radius: 8px; background-color: white; padding: 10px; height: 80px;">
          <SbIcon :icon-path="iconPath" />
          <span style="font-size: 12px; margin-top: 10px;">{{ iconPath }}</span>
        </div>
      </template>
    </div>
  `
});

export const ElementIcons = {
  render: AllIconsTemplate,

  args: {
    iconsPaths: Object.keys(elementIcons).map((key) => `Element:${key}`)
  }
};

export const CustomIcons = {
  render: AllIconsTemplate,

  args: {
    iconsPaths: Object.keys(customIcons).map((key) => `Custom:${key}`)
  }
};
