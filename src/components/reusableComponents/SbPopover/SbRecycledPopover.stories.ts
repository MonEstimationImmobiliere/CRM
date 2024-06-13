
import type { Story } from "@storybook/vue3";
import { shallowRef } from "vue";

import SbCardZone from "../SbCardZone/SbCardZone.vue";
import SbRecycledPopover from "./SbRecycledPopover.vue";

export default {
  title: "Component/SbRecycledPopover",
  component: SbRecycledPopover
};

const Template: Story<typeof SbRecycledPopover> = (args) => ({
  components: {
    SbCardZone,
    SbRecycledPopover
  },
  setup() {
    const recycledPopoverRef = shallowRef();

    const handleMouseEnter = (event, text) => recycledPopoverRef.value?.open({ reference: event.target, data: { customData: text } });
    const handleMouseLeave = () => recycledPopoverRef.value?.closeByMouseLeave();

    return { ...args, recycledPopoverRef, handleMouseEnter, handleMouseLeave };
  },
  template: `
    <SbCardZone
      class="mb-3"
      style="width: 200px"
      hoverable
      @mouseenter="handleMouseEnter($event, 'zone 1')"
      @mouseleave="handleMouseLeave($event, 'zone 1')"
    >
    Hover zone 1 to open
    </SbCardZone>
    <SbCardZone
      style="width: 200px"
      hoverable
      @mouseenter="handleMouseEnter($event, 'zone 2')"
      @mouseleave="handleMouseLeave($event, 'zone 2')"
    >
    Hover zone 2 to open
    </SbCardZone>
    <SbRecycledPopover ref="recycledPopoverRef" placement="right">
      <template #default={data}>
        Its the same popover with data {{ data }} 😋 Its recycled ♻️
      </template>
    </SbRecycledPopover>
  `
});

export const Default = Template.bind({});

