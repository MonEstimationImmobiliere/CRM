import type { StoryFn } from "@storybook/vue3";

import SbRating from "./SbRating.vue";

export default {
  title: "Component/SbRating",
  component: SbRating
};

const Template: StoryFn<typeof SbRating> = (args) => ({
  components: {
    SbRating
  },
  setup() {
    return { args };
  },
  template: `
  <div style="width: 400px;">
    <SbRating v-bind="args" />
  </div>
  `
});

export const Default = {
  render: Template,

  args: {
    rating: {
      id: 1,
      userName: "John Doe",
      ratingTitle: "Great product!",
      ratingText: "I really like this product, it's great!",
      ratingStarAmount: 5
    }
  }
};
