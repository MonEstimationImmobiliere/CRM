<template>
  <SbCardZone
    class="sb-image-uploader"
    :class="{'is-inline': props.inline}"
    hoverable
    :disabled="props.disabled"
    :active="isDraggingFile"
    v-bind="onClickAddZoneHandler"
    @drop.prevent="handleAddZoneDrop"
    @dragover.prevent="handleAddZoneDragOver"
    @dragleave.prevent="handleAddZoneDragLeave"
  >
    <template v-if="currentImage && props.removeButton">
      <div>
        <SbButton
          icon-path="Element:CloseBold"
          :icon-size="12"
          class="sb-image-uploader-remove-button"
          @click.stop="handleClearFilesButton"
        />
      </div>
    </template>
    <template v-if="currentImage">
      <div>
        <img :src="currentImage" alt="image" class="sb-image-uploader-image">
      </div>
    </template>

    <template v-if="slots.clickZone">
      <div class="click-zone" @click="handleClickZoneClick">
        <slot name="clickZone" />
      </div>
    </template>
    <template v-else>
      <div class="sb-image-uploader-text">
        <template v-if="instruction && !currentImage">
          <SbIcon icon-path="Element:Upload" :icon-size="25" />
          <SbTypography type="info" as="p2" class="sb-image-uploader-instruction mt-1">
            {{ instruction }}
          </SbTypography>
        </template>
      </div>
    </template>

    <input
      ref="inputRef"
      class="sb-image-uploader-input"
      name="file"
      accept="image/*"
      :disabled="props.disabled"
      type="file"
      @change="handleInputFileChange"
    >
    <slot />
  </SbCardZone>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, useSlots } from "vue";
import { useI18n } from "vue-i18n";

import { useDisclose } from "@confero/common/hooks/useDisclose";

import SbButton from "../SbButton/SbButton.vue";
import SbCardZone from "../SbCardZone/SbCardZone.vue";
import SbCropDialog from "../SbCropDialog/SbCropDialog.vue";
import SbIcon from "../SbIcon/SbIcon.vue";
import SbTypography from "../SbTypography/SbTypography.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    instruction?: string;
    drag?: boolean;
    disabled?: boolean;
    accept?: string;
    inline?: boolean;
    removeButton?: boolean;
    crop?: boolean;
    cropOptions?: { [key: string]: string | number | object };
  }>(), {
    modelValue: null,
    instruction: "",
    drag: true,
    disabled: false,
    accept: "",
    inline: false,
    removeButton: false,
    cropOptions: undefined
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const { t } = useI18n();
const { open } = useDisclose();
const slots = useSlots();

const newUploadImage = ref<string | null>(null);

const currentImage = computed((): string | null => {
  return props.modelValue ?? newUploadImage.value;
});

const inputRef = shallowRef<HTMLInputElement>();
const isDraggingFile = ref<boolean>(false);

const dropZoneIsClickable = computed((): boolean => !props.disabled && !slots.clickZone);
const onClickAddZoneHandler = computed((): Record<string, unknown> => {
  if (dropZoneIsClickable.value) {
    return {
      onClick: triggerUploader
    };
  }
  return {};
});

const instruction = computed((): string => {
  return props.instruction || t("sb.imageUploader.instruction");
});

const triggerUploader = (): void => {
  if (!props.disabled && inputRef.value) {
    inputRef.value.value = "";
    inputRef.value.click();
  }
};

const handleClearFilesButton = (): void => {
  newUploadImage.value = null;
  emit("update:modelValue", null);
};

const handleClickZoneClick = (): void => {
  triggerUploader();
};

const handleInputFileChange = async (event): Promise<void> => {
  const newImage = URL.createObjectURL(event.target.files[0]);
  if (props.crop) {
    const cropDialog = open(SbCropDialog, {
      image: newImage,
      ...props.cropOptions
    });
    cropDialog.on("cropped", (url): void => {
      newUploadImage.value = url ?? newImage;
      emit("update:modelValue", url ?? newImage);
    });
    return;
  }
  newUploadImage.value = newImage;
  emit("update:modelValue", newImage);
};

const handleAddZoneDrop = async (event): Promise<void> => {
  isDraggingFile.value = false;
  if (props.disabled || !props.drag) return;
  if (!event.dataTransfer.files.length) return;

  const newImage = URL.createObjectURL(event.dataTransfer?.files[0]);
  newUploadImage.value = newImage;
  emit("update:modelValue", newImage);
};

const handleAddZoneDragOver = (): void => {
  if (!props.disabled && props.drag) isDraggingFile.value = true;
};

const handleAddZoneDragLeave = (): void => {
  isDraggingFile.value = false;
};

defineExpose({
  triggerUploader,
  handleClearFilesButton
});
</script>

<style lang="scss" scoped>

.sb-image-uploader {
  --el-card-padding: var(--sb-gap-y) var(--sb-gap-x);
  --sb-card-border-style: dashed;
  --sb-card-border-width: 2px;
  border-radius: var(--el-border-radius-base);
  height: calc(var(--el-component-size-large) * 2);
  overflow: hidden;
  width: calc(var(--el-component-size-large) * 2);

  .click-zone {
    display: inline-block;
  }

  &.is-inline {
    :deep(.el-card__body) {
      align-items: stretch;
      flex-direction: row;
      gap: var(--sb-gap-x);
      justify-content: flex-start;

    }
  }

  :deep(.el-card__body) {
    align-items: center;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: var(--sb-gap-y);
    justify-content: center;
    position: relative;

    &:hover {
      .sb-image-uploader-remove-button {
        display: flex;
      }
    }

    .sb-image-uploader-remove-button {
      align-items: center;
      background-color: var(--el-color-info-light-5);
      border-radius: calc(var(--el-border-radius-base) * 5);
      display: none;
      height: 30px;
      justify-content: center;
      left: calc(var(--sb-gap-y) * -1);
      position: absolute;
      top: calc(var(--sb-gap-y) * -1);
      width: 30px;
      z-index: 1;

    }

    .sb-image-uploader-image {
      height: 100%;
      left: 0;
      object-fit: contain;
      position: absolute;
      top: 0;
      width: 100%;
    }

    .sb-image-uploader-text {
      align-items: center;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .sb-image-uploader-instruction {
        text-align: center;
      }

    }

    .sb-image-uploader-input {
      display: none;
    }
  }
}
</style>
