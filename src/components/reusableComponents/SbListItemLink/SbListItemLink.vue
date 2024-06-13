<template>
  <div class="list-item-link" :class="{link: asClickable, disabled}" @click="handleClick">
    <div class="content">
      <div class="title">
        <span>{{ props.title }}</span>
        <template v-if="asClickable">
          <SbIcon class="chevron" icon-path="Element:ArrowRightBold" />
        </template>
      </div>
      <p class="text">
        {{ props.text }}
      </p>
    </div>
    <slot name="bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { openWindow } from "@confero/common/helpers/common";

import SbIcon from "../SbIcon/SbIcon.vue";

const props = withDefaults(defineProps<{
  link?: boolean;
  title?: string;
  text?: string;
  href?: string;
  disabled?: boolean;
}>(), {
  link: true,
  title: "",
  text: "",
  href: undefined,
  disabled: false
});

const emit = defineEmits<{
  (e: "click"): void;
}>();

const asClickable = computed((): boolean => props.link || !!props.href);

const handleClick = (): void => {
  if (props.href) openWindow(props.href);
  emit("click");
};

</script>

<style lang="scss" scoped>
.list-item-link {
  border-bottom: 0.5px solid var(--el-color-info-light-7);
  padding: 20px 0;

  > div {
    flex: 1;
  }

  &.link:not(.disabled) {
    cursor: pointer;

    &:hover {
      .title {
        text-decoration: underline;
      }
    }
  }

  &.disabled {
    color: var(--el-color-info);
  }

  .content {
    .title {
      align-items: center;
      display: flex;
      justify-content: flex-start;

      span {
        font-size: 18px;
        font-weight: bold;
      }

      .chevron {
        margin-left: auto;
      }
    }

    .text {
      color: var(--el-color-info);
      font-size: 13px;
      line-height: 16px;
      margin: 0;
      width: 80%;
    }
  }
}
</style>