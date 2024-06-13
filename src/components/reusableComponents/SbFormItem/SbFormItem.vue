<template>
  <ElFormItem
    class="sb-form-item"
    :class="{'has-subtitle': hasSubtitle, 'mb-0': props.noMargin}"
    v-bind="$attrs"
  >
    <template #label="{ label }">
      <template v-if="hasLabel">
        <SbTypography
          :semi-bold="props.labelSemiBold"
          :type="props.labelType"
          class="sb-form-item-label"
        >
          <slot name="label">
            {{ label }}
          </slot>
          <slot name="label-end" />
        </SbTypography>
        <template v-if="props.resetValue !== undefined">
          <SbPopover
            placement="top"
          >
            <template #reference>
              <SbLink
                size="small"
                type="primary"
                icon-path="Element:RefreshRight"
                class="sb-form-item-reset"
                @click="handleResetValueClick"
              />
            </template>

            <SbTypography as="p1" semi-bold>
              {{ t('common.initialValue') }} :
            </SbTypography>
            <div>{{ props.resetValue || t("common.words.none") }}</div>
          </SbPopover>
        </template>
      </template>
    </template>
    <template v-if="hasSubtitle">
      <SbTypography
        type="info"
        class="sb-form-item-subtitle"
        as="p2"
      >
        <slot name="subtitle">
          {{ subtitle }}
        </slot>
      </SbTypography>
    </template>
    <slot />
    <slot name="after" />
  </ElFormItem>
</template>

<script setup lang="ts">
import { ElFormItem } from "element-plus";
import { computed, useAttrs, useSlots } from "vue";
import { useI18n } from "vue-i18n";

import SbLink from "../SbLink/SbLink.vue";
import SbPopover from "../SbPopover/SbPopover.vue";
import SbTypography from "../SbTypography/SbTypography.vue";

const props = withDefaults(defineProps<{
  subtitle?: string;
  noMargin?: boolean;
  labelSemiBold?: boolean;
  labelType?: "info" | "success" | "warning" | "danger";
  resetValue?: string | number | boolean | null;
}>(), {
  subtitle: undefined,
  noMargin: false,
  labelSemiBold: true,
  labelType: undefined,
  resetValue: undefined
});

const emit = defineEmits<{
  (e: "reset"): void;
}>();

const { t } = useI18n();
const slots = useSlots();
const attrs = useAttrs();

const hasLabel = computed((): boolean => !!attrs.label || !!slots.label);
const hasSubtitle = computed((): boolean => props.subtitle !== undefined || !!slots.subtitle);
const handleResetValueClick = (): void => {
  emit("reset");
};

</script>

<style scoped lang="scss">
.el-form-item.sb-form-item {
  .sb-form-item-reset {
    margin-left: 5px;
  }

  :deep(.el-form-item__label) {
    align-items: center;
    display: flex;
    justify-content: flex-start;
    margin-bottom: 4px;

    &:empty {
      display: none;
    }

    .sb-form-item-label {
      display: inline;
    }
  }

  :deep(.el-form-item__content) {
    line-height: normal;

    .sb-form-item-subtitle:not(:empty) {
      margin-bottom: 6px;
    }
  }

  &.is-error :deep(.el-input__wrapper) {
    --sb-input-border-color: var(--el-color-danger) !important;
  }
}
</style>

