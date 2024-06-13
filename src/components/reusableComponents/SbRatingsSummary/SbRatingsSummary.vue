<template>
  <div class="product-rating-summary">
    <div class="product-rating-summary-title">
      <span class="product-rating-summary-title-text">Notes et avis</span>
      <SbLink :underline="false" href="#" class="product-rating-summary-title-action">
        {{ t('common.seeAll') }}
      </SbLink>
    </div>
    <div class="product-rating-summary-content">
      <div class="product-rating-summary-content-global-score">
        <SbTypography bold as="h1">
          {{ ratingAverage }}
        </SbTypography>
        <SbTypography type="info">
          sur 5
        </SbTypography>
      </div>
      <div class="product-rating-summary-content-detailed-score">
        <template v-for="ratingStarAmount in Object.keys(productRatingsGroupedByStarCount).reverse()" :key="ratingStarAmount">
          <div class="score-line">
            <div class="score-line-stars">
              <template v-for="(_, index) in new Array(Number(ratingStarAmount)).fill(0)" :key="`${ratingStarAmount}-star-${index}`">
                <SbIcon icon-path="Element:StarFilled" />
              </template>
            </div>
            <ElProgress :percentage="getRatingAverageAtStarCount(Number(ratingStarAmount))" :show-text="false" />
          </div>
        </template>
        <SbTypography type="info" class="d-flex justify-content-end">
          {{ ratingsCount }} {{ t('common.words.ratings') }}
        </SbTypography>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElProgress } from "element-plus";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import type { IRating } from "@confero/common/types/ticket";

import SbIcon from "../SbIcon/SbIcon.vue";
import SbLink from "../SbLink/SbLink.vue";
import SbTypography from "../SbTypography/SbTypography.vue";
const props = defineProps<{
  ratings: Array<IRating>;
}>();

const { t } = useI18n();

const productRatingsGroupedByStarCount = computed((): Record<number, IRating[]> => {
  return props.ratings.reduce((groupedRatings, rating): Record<number, IRating[]> => {
    return {
      ...groupedRatings,
      [rating.ratingStarAmount]: [
        ...groupedRatings[rating.ratingStarAmount] || [],
        rating
      ]
    };
  }, {} as Record<number, IRating[]>);
});

const ratingsCount = computed((): number => props.ratings.length);

const ratingAverage = computed((): string => {
  const totalRating = props.ratings.reduce((total, rating): number => total + rating.ratingStarAmount, 0);

  return (totalRating / ratingsCount.value).toFixed(1);
});

const getRatingAverageAtStarCount = (starCount: number): number => {
  const ratingsAtStarCount = productRatingsGroupedByStarCount.value[starCount] || [];

  return ratingsAtStarCount.length / ratingsCount.value * 100;
};
</script>

<style lang="scss" scoped>
.product-rating-summary {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 10px;

  .product-rating-summary-title {
    align-items: center;
    display: flex;

    .product-rating-summary-title-text {
      font-size: 18px;
      font-weight: bold;
    }

    .product-rating-summary-title-action {
      margin-left: auto;
    }
  }

  .product-rating-summary-content {
    align-items: center;
    display: flex;
    justify-content: center;

    .product-rating-summary-content-global-score {
      align-items: center;
      display: flex;
      flex-direction: column;

      h1 {
        font-size: 50px;
        font-weight: bolder;
        line-height: 50px;
        margin-bottom: 0;
      }
    }

    .product-rating-summary-content-detailed-score {
      display: flex;
      flex-direction: column;
      margin-left: auto;

      .score-line {
        align-items: center;
        display: flex;
        gap: 10px;
        justify-content: flex-end;

        &-stars {
          display: flex;

          img {
            height: 15px;
            width: 15px;
          }
        }

        .el-progress {
          width: 150px;

          :deep(.el-progress-bar) {
            .el-progress-bar__inner {
              background-color: var(--el-border-color-dark);
            }

          }
        }
      }

    }
  }
}

</style>
