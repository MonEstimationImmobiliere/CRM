<template>
  <span
    class="sb-optional-text"
    :class="classes"
  >
    {{ content }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  text?: string | number | null;
  placeholder?: string;
}>();

const { t } = useI18n();

const hasText = computed((): boolean => !!props.text && !!`${props.text}`.trim());
const placeholder = computed((): string => props.placeholder || t("common.words.notProvided"));
const content = computed((): typeof props.text | string => hasText.value ? props.text : placeholder.value);
const classes = computed((): Record<string, boolean> => ({ "text-disabled": !hasText.value, "text-italic": !hasText.value }));
</script>
