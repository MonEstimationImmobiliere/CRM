<template>
    <component
      :is="componentToLoad"
      class="sb-typography"
      :class="classes"
    >
      <slot />
    </component>
  </template>
  
  <script setup lang="ts">
  import { computed } from "vue";
  
  import { ComponentType } from "../../../types/common";
  
  import type { Typography } from "./types";
  
  const props = withDefaults(
    defineProps<{
      as?: Typography;
      type?: ComponentType;
      bold?: boolean;
      semiBold?: boolean;
      medium?: boolean;
      italic?: boolean;
      uppercase?: boolean;
    }>(), {
      as: "p1",
      type: "default",
      bold: false,
      semiBold: false,
      medium: false,
      italic: false,
      uppercase: false
    }
  );
  
  const componentToLoad = computed<string>((): string => {
    if (props.as.startsWith("h")) return props.as;
    return props.as[0] ?? "span";
  });
  
  const classes = computed((): Record<string, boolean> => ({
    [props.as]: true,
    [props.type]: true,
    "text-bold": props.bold,
    "text-semi-bold": props.semiBold,
    "text-medium": props.medium,
    "text-italic": props.italic,
    "text-uppercase": props.uppercase
  }));
  
  </script>
  
  <style scoped lang="scss">
  .sb-typography {
    margin-block-end: 0;
    margin-block-start: 0;
    user-select: text;



    &.label {
      font-size: 16px;
      font-weight: 400;
    }

    &.groupLabel {
      font-size: 1.1rem;
      font-weight: 600;
    }
  
    &.h1 {
      font-size: 34px;
      font-weight: 700;
    }
  
    &.h2 {
      font-size: 28px;
      font-weight: 600;
    }
  
    &.h3 {
      font-size: 24px;
      font-weight: 500;
    }
  
    &.h4 {
      font-size: 20px;
      font-weight: 400;
    }
  
    &.h5 {
      font-size: var(--el-font-size-extra-large);
      font-weight: 400;
    }
  
    &.h6 {
      font-size: var(--el-font-size-large);
      font-weight: 400;
    }
  
    &.p1 {
      font-size: inherit;
      font-weight: 400;
    }
  
    &.p2 {
      font-size: var(--el-font-size-small);
      font-weight: 400;
    }
  
    &.default {
      color: currentColor;
    }
  
    &.primary {
      // color: var(--el-color-primary);
      color: var(--blue);

    }
  
    &.success {
      color: var(--el-color-success);
    }
  
    &.info {
      color: var(--el-color-info);
    }
  
    &.warning {
      color: var(--el-color-warning);
    }
  
    &.danger {
      color: var(--el-color-danger);
    }

    &.anthracite {
      color: var(--anthracite);
    }
  
  }
  </style>
  