<template>
  <ElInput
    ref="inputRef"
    class="sb-input"
    :text-align="props.textAlign"
    :class="{ 'is-shadow': props.shadow }"
    :model-value="internalValue"
    :formatter="handleFormatter"
    @focus="handleInputFocus"
    @blur="handleInputBlur"
    @update:model-value="handleModelValueUpdate"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElInput>
</template>

<script setup lang="ts">
import { ElInput } from "element-plus";
import { ref, shallowRef, watch } from "vue";

import { cleanNumericString } from "@/helpers/common";
import type { Nullable } from "@/types/common";

type InputFormat = "integer" | "float" | "currency";
type ModelValue = string | number | null;

const props = withDefaults(
  defineProps<{
    modelValue?: ModelValue;
    shadow?: boolean;
    filter?: (value: ModelValue) => ModelValue;
    format?: Nullable<InputFormat>;
    textAlign?: "left" | "center" | "right";
    uppercase?: boolean;
    removeSpecialCharacter?: boolean;
    prefix?: string;
  }>(), {
    modelValue: undefined,
    shadow: false,
    format: undefined,
    filter: (value): ModelValue => value,
    textAlign: "left",
    prefix: undefined,
    removeSpecialCharacter: false,
    uppercase: false
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
}>();

const integerFormatter = new Intl.NumberFormat("fr-Fr", { style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 20 });
const floatFormatter = new Intl.NumberFormat("fr-Fr", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 20 });
const currencyFormatter = new Intl.NumberFormat("fr-Fr", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 20 });

const toInputDecimal = (value: string | number): string => cleanNumericString(`${value}`);

const toModelValueDecimal = (value: string | number): string|number => {
  const cleanedValue = `${value}`.replace(/[^0-9\-,.]+/g, "").replace(/[,]+/g, ".");
  if (!cleanedValue.length) return "";
  return parseFloat(cleanedValue);
};

const inputFormatters: Record<InputFormat, (string) => string|number> = {
  integer: (value): string => value ? integerFormatter.format(parseModelValue(value)) : value,
  float: (value): string => value ? floatFormatter.format(parseModelValue(value)) : value,
  currency: (value): string => value ? currencyFormatter.format(parseModelValue(value)) : value
};

const inputParsers: Record<InputFormat, (string) => string|number> = {
  integer: (value): string => toInputDecimal(value),
  float: (value): string => toInputDecimal(value),
  currency: (value): string => toInputDecimal(value)
};

const modelValueParsers: Record<InputFormat, (string) => string|number> = {
  integer: (value): string|number => toModelValueDecimal(value),
  float: (value): string|number => toModelValueDecimal(value),
  currency: (value): string|number => toModelValueDecimal(value)
};

const formatInputValue = (value): string => props.format ? inputFormatters[props.format](value) : value;
const parseInputValue = (value): number => props.format ? inputParsers[props.format](value) : value;
const parseModelValue = (value): number => props.format ? modelValueParsers[props.format](value) : value;

const inputRef = shallowRef<InstanceType<typeof ElInput>>();
const internalValue = ref();
const isInputFocused = ref(false);

watch((): typeof props.modelValue => props.modelValue, (value): void => {
  if (isInputFocused.value) {
    internalValue.value = parseInputValue(value);
  }
  else {
    internalValue.value = formatInputValue(value);
  }
}, {
  immediate: true
});

const focus = (): void => {
  inputRef.value?.focus();
};
const select = (): void => {
  inputRef.value?.select();
};

const handleInputFocus = (): void => {
  isInputFocused.value = true;
  internalValue.value = parseInputValue(internalValue.value);
};

const handleInputBlur = (): void => {
  isInputFocused.value = false;
  internalValue.value = formatInputValue(internalValue.value);
};

const handleModelValueUpdate = (value): void => {
  internalValue.value = props.filter(value);
  return emit("update:modelValue", parseModelValue(internalValue.value));
};

const handleFormatter = (value: string): string => {
  let finalValue = value;
  if (props.prefix) {
    if (value === props.prefix) {
      finalValue = "";
    } else if (value.length && !value.match(new RegExp(`^${props.prefix}`, "i"))) {
      finalValue = value.replace(new RegExp(`^\\s*[${props.prefix}]*\\s*`, "i"), props.prefix);
    }
  }
  let formattedFinalValue = props.uppercase ? finalValue.toUpperCase() : finalValue;
  if (props.removeSpecialCharacter) {
    const removeSpecialCharacterExp = new RegExp("[^a-zA-Z0-9]", "g");
    formattedFinalValue = formattedFinalValue.replace(removeSpecialCharacterExp, "");
  }
  return formattedFinalValue;
};

defineExpose({ focus, select });

</script>

<style scoped lang="scss">
.sb-input {
  --sb-input-border-color: transparent;
  font-size: var(--el-font-size-base);

  :deep(.el-input__wrapper) {
    padding: 5px;

    .el-input__inner {
      --el-input-inner-height: var(--el-input-height);
    }
  }

  :deep(.el-textarea__inner) {
    padding: 10px var(--sb-gap-x);
  }

  :deep(input),
  :deep(textarea) {
    &[text-align='left'] {
      text-align: left;
    }

    &[text-align='center'] {
      text-align: center;
    }

    &[text-align='right'] {
      text-align: right;
    }
  }

  &.is-shadow {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      box-shadow: 0 0 0 1px var(--sb-input-border-color) inset, var(--el-box-shadow);

      &:hover {
        --sb-input-border-color: var(--el-input-hover-border-color);
      }

      &:focus {
        --sb-input-border-color: var(--el-input-focus-border-color);
      }
    }

    &.is-disabled {
      --sb-input-border-color: transparent;
    }
  }

  &.el-input--small {
    font-size: var(--el-font-size-small);
  }

  &.el-input--large {
    font-size: var(--el-font-size-large);
  }

  &.is-disabled {
    --el-text-color-placeholder: var(--el-disabled-placeholder-color);
  }
}
</style>
