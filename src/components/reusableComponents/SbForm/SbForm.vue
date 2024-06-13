<template>
  <ElForm
    ref="elementFormRef"
    class="sb-form"
    label-position="top"
    require-asterisk-position="right"
    @validate="handleFormValidate"
    @input="handleFormInput"
    @change="handleFormChange"
    @submit.prevent="handleFormSubmit"
  >
    <slot />
    <template v-if="props.submitWithEnter">
      <input class="d-none" type="submit">
    </template>
  </ElForm>
</template>

<script setup lang="ts">
import type { ValidateFieldsError } from "async-validator";
import { ElForm, FormInstance } from "element-plus";
import { computed, onMounted, reactive, ref, shallowRef } from "vue";

const props = withDefaults(
  defineProps<{
    submitWithEnter?: boolean;
  }>(), {
    submitWithEnter: true
  }
);

const emit = defineEmits<{
  (e: "touch", isFormTouched: boolean): void;
  (e: "validate", isFormValid: boolean, formItemsValidity: Record<string, boolean>): void;
  (e: "submit", event: SubmitEvent): void;
}>();

const elementFormRef = shallowRef<FormInstance>();
const formItemsValidity = reactive<Record<string, boolean>>({});
const isFormTouched = ref(false);

const isFormValid = computed((): boolean => Object.values(formItemsValidity).every((formItemValidity): boolean => formItemValidity));

onMounted(async (): Promise<void> => {
  if (!elementFormRef.value) return;
  const autofocusNode = elementFormRef.value.$el.querySelector(".autofocus input, .autofocus textarea");
  if (autofocusNode) setTimeout((): void => autofocusNode.focus(), 0);

  const autoSelectNode = elementFormRef.value.$el.querySelector(".autoselect input");
  if (autoSelectNode) setTimeout((): void => autoSelectNode.select(), 0);
});

const setFormTouchedState = (isTouched: boolean): void => {
  isFormTouched.value = isTouched;
  emit("touch", isTouched);
};

const touchForm = (): void => setFormTouchedState(true);

const unTouchForm = (): void => setFormTouchedState(false);

const resetForm = (props?: string[]): void => {
  unTouchForm();
  elementFormRef.value?.resetFields(props);
};

const clearValidate = (props?: string[]): void => {
  elementFormRef.value?.clearValidate(props);

  if (Array.isArray(props)) {
    return props.forEach((formItemName): void => {
      delete formItemsValidity[formItemName];
    });
  }

  Object.keys(formItemsValidity).forEach((formItemName): void => {
    delete formItemsValidity[formItemName];
  });
};

const validateForm = async (props?: string[]): Promise<{ isValid: boolean; invalidFields?: ValidateFieldsError }> => {
  if (!elementFormRef.value) throw new Error("Form not mounted yet");

  return new Promise((resolve): void => {
    const formValidateCallback = (isValid, invalidFields): void => resolve({ isValid, invalidFields });

    if (props) {
      elementFormRef.value?.validateField(props, formValidateCallback);
    }
    else {
      elementFormRef.value?.validate(formValidateCallback);
    }
  });
};

const handleFormValidate = (formItemProperty, isFormItemValid): void => {
  formItemsValidity[formItemProperty] = isFormItemValid;
  return emit("validate", isFormValid.value, formItemsValidity);
};

const handleFormInput = (): void => touchForm();
const handleFormChange = (): void => touchForm();
const handleFormSubmit = (event: SubmitEvent): void => emit("submit", event);

defineExpose({
  resetForm,
  validateForm,
  touchForm,
  unTouchForm,
  clearValidate,
  isFormValid,
  isFormTouched
});
</script>
