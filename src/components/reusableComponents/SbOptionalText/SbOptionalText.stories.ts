
import type { Story } from "@storybook/vue3";

import SbTypography from "../SbTypography/SbTypography.vue";
import SbOptionalText from "./SbOptionalText.vue";

export default {
  title: "Component/SbOptionalText",
  component: SbOptionalText
};

const DefaultTemplate: Story<typeof SbOptionalText> = (args) => ({
  components: { SbOptionalText, SbTypography },
  setup() {
    return { args };
  },
  template: `
  <div style="display: flex; flex-direction: column; gap: 10px;">
    <SbOptionalText />
    <SbOptionalText placeholder="This is a custom placeholder"/>
    <SbTypography as="h3" type="success">
      <SbOptionalText placeholder="This is a custom placeholder wrapped in a success heading typography"/>
    </SbTypography>
    <SbTypography as="h3" type="success">
      <SbOptionalText text="With some text wrapped in a success heading typography"/>
    </SbTypography>
  </div>
  `
});

export const Default = DefaultTemplate.bind({});
