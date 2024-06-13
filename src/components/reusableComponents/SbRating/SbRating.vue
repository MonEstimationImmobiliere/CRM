<template>
  <div class="rating">
    <div class="rating-heading">
      <SbTypography bold>
        {{ rating.ratingTitle }}
      </SbTypography>
      <SbTypography type="info" class="ml-auto">
        4 mai
      </SbTypography>
    </div>
    <div class="rating-item-rating">
      <div class="stars">
        <template v-for="(_, index) in ratingStars" :key="`rating-start-carousel-item-${index}`">
          <SbIcon icon-path="Element:StarFilled" />
        </template>
      </div>
      <SbTypography type="info" class="ml-auto">
        {{ rating.userName }}
      </SbTypography>
    </div>
    <SbTypography as="p1">
      {{ rating.ratingText }}
    </SbTypography>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import type { IRating } from "@confero/common/types/ticket";

import SbIcon from "../SbIcon/SbIcon.vue";
import SbTypography from "../SbTypography/SbTypography.vue";

const props = defineProps<{
  rating: IRating;
}>();

const ratingStars = computed((): number[] => new Array(props.rating.ratingStarAmount).fill(0));

</script>

<style lang="scss" scoped>
.rating {
  background-color: var(--el-color-info-light-7);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
  min-width: 320px;
  padding: 1em;

  .rating-heading {
    display: flex;
  }

  .rating-item-rating {
    align-items: center;
    display: flex;

    .stars {
      display: flex;
      margin-left: -2px;
    }
  }
}
</style>