
import type { Story } from "@storybook/vue3";

import SbButton from "../SbButton/SbButton.vue";
import SbPopover from "./SbPopover.vue";

export default {
  title: "Component/SbPopover",
  component: SbPopover
};

const Template: Story<typeof SbPopover> = () => ({
  components: {
    SbPopover,
    SbButton
  },
  template: `
    <SbPopover trigger="click">
      <template #reference>
        <SbButton>Popover</SbButton>
      </template>
      A popover content
    </SbPopover>
  `
});

export const Default = Template.bind({});

