<template>
  <div class="sb-carousel">
    <div v-if="props.title" class="sb-carousel-title">
      <span>
        {{ props.title }}
      </span>

      <div class="arrows">
        <div class="left" @click="handleLeftClick">
          <SbIcon icon-path="Element:ArrowLeft" />
        </div>
        <div class="right" @click="handleRightClick">
          <SbIcon icon-path="Element:ArrowRight" />
        </div>
      </div>
    </div>

    <div ref="carouselScroll" class="sb-carousel-scroll">
      <div class="items-wrapper">
        <slot name="items" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";

import SbIcon from "../SbIcon/SbIcon.vue";

const props = withDefaults(
  defineProps<{
    title?: string;
  }>(), {
    title: ""
  }
);

const carouselScroll = shallowRef<HTMLElement | null>(null);

const scrollNext = ({ negative = false } = {}): void => {
  if (!carouselScroll.value) return;
  const { offsetWidth } = carouselScroll.value;
  let finalOffset = offsetWidth;
  if (negative) finalOffset = finalOffset * -1;
  carouselScroll.value.scrollTo({
    left: carouselScroll.value.scrollLeft + finalOffset * 0.75,
    behavior: "smooth"
  });
};

const handleLeftClick = (): void => {
  scrollNext({ negative: true });
};

const handleRightClick = (): void => {
  scrollNext();
};

</script>

<style lang="scss" scoped>
.sb-carousel {
  --carousel-padding-x: var(--sb-gap-x);

  .sb-carousel-title {
    display: flex;

    span {
      flex: 1;
      font-size: 1.4em;
      font-weight: bold;
      padding-bottom: var(--sb-gap-y);
      padding-left: var(--carousel-padding-x);
    }

    .arrows {
      display: flex;
      justify-content: center;
      padding-right: var(--carousel-padding-x);

      .left,
      .right {
        align-items: center;
        background: var(--el-color-info-light-7);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        height: 25px;
        justify-content: center;
        margin-left: 15px;
        width: 25px;
      }
    }

  }

  .sb-carousel-scroll {
    -webkit-overflow-scrolling: touch;
    overflow-x: auto;
    padding-bottom: 10px;
    padding-left: var(--carousel-padding-x);
    padding-top: 10px;

    &::-webkit-scrollbar {
      display: none;
    }

    .items-wrapper {
      display: flex;
      flex-wrap: nowrap;
      width: fit-content;
    }
  }
}
</style>
