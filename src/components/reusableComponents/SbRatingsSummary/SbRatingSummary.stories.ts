import type { StoryFn } from "@storybook/vue3";

import SbRatingsSummary from "./SbRatingsSummary.vue";

export default {
  title: "Component/SbRatingsSummary",
  component: SbRatingsSummary
};

const Template: StoryFn<typeof SbRatingsSummary> = (args) => ({
  components: {
    SbRatingsSummary
  },
  setup() {
    return { args };
  },
  template: `
  <div style="width: 400px;">
    <SbRatingsSummary v-bind="args" />
  </div>
  `
});

export const Default = {
  render: Template,

  args: {
    ratings: [
      {
        id: 1,
        userName: "John Doe",
        ratingTitle: "Great product!",
        ratingText: "I really like this product, it's great!",
        ratingStarAmount: 5
      },
      {
        id: 1,
        userName: "John Doe",
        ratingTitle: "Great product!",
        ratingText: "I really like this product, it's great!",
        ratingStarAmount: 4
      },
      {
        id: 1,
        userName: "John Doe",
        ratingTitle: "Great product!",
        ratingText: "I really like this product, it's great!",
        ratingStarAmount: 3
      },
      {
        id: 1,
        userName: "John Doe",
        ratingTitle: "Great product!",
        ratingText: "I really like this product, it's great!",
        ratingStarAmount: 4
      },
      {
        id: 1,
        userName: "John Doe",
        ratingTitle: "Great product!",
        ratingText: "I really like this product, it's great!",
        ratingStarAmount: 5
      },
      {
        id: 1,
        userName: "John Doe",
        ratingTitle: "Great product!",
        ratingText: "I really like this product, it's great!",
        ratingStarAmount: 1
      },
      {
        id: 1,
        userName: "John Doe",
        ratingTitle: "Great product!",
        ratingText: "I really like this product, it's great!",
        ratingStarAmount: 2
      },
      {
        id: 1,
        userName: "John Doe",
        ratingTitle: "Great product!",
        ratingText: "I really like this product, it's great!",
        ratingStarAmount: 3
      }
    ]
  }
};
