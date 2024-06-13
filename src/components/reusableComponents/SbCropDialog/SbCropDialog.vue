<template>
  <SbDialog
    :title="titleComputed"
    class="sb-crop-dialog"
  >
    <template #title>
      <SbTypography
        semi-bold
        class="advise d-flex align-items-center"
        as="h5"
      >
        <div class="w-100 h-100 d-flex align-items-center gap-10">
          <template v-if="props.titleSuffixIcon">
            <SbIcon :icon-path="props.titleSuffixIcon" :icon-size="20" type="primary" />
          </template>
          {{ titleComputed }}
        </div>
      </SbTypography>
    </template>
    <div v-loading="!imageLoaded">
      <div class="crop-container w-100 h-100 d-flex flex-column align-items-center">
        <SbTypography class="advise d-flex align-items-center" as="h6">
          <SbIcon icon-path="Element:FullScreen" />
          {{ t("common.cropLogoAdvise") }}
        </SbTypography>
        <SbCropper
          ref="sbCropperRef"
          :image="props.image"
          v-bind="$attrs"
          @cropped="croppedHandleEvent"
          @crop-failed="croppedFailed"
          @ready="handleCropperImageReady"
        />
      </div>
    </div>
    <template #footer>
      <SbButton @click="cancelCropperHandleClicked">
        {{ t("common.words.reset") }}
      </SbButton>
      <SbButton type="primary" @click="okCropperHandleClicked">
        {{ t("common.words.save") }}
      </SbButton>
    </template>
  </SbDialog>
</template>

<script lang="ts" setup>

import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import type { InternalDisclosable } from "@confero/common/types/disclose";

import SbButton from "../SbButton/SbButton.vue";
import SbCropper from "../SbCropper/SbCropper.vue";
import SbDialog from "../SbDialog/SbDialog.vue";
import SbIcon from "../SbIcon/SbIcon.vue";
import type { IconPath } from "../SbIcon/types";
import SbTypography from "../SbTypography/SbTypography.vue";

const props = withDefaults(defineProps<{
  titleSuffixIcon?: IconPath;
  title?: string;
  image: string;
  disclosable?: InternalDisclosable;
}>(), {
  disclosable: undefined,
  titleSuffixIcon: "Custom:DownloadArrow",
  title: undefined
});

const emit = defineEmits<{
  (e: "cropped", imageCropped: string): void;
  (e: "crop-failed"): void;
}>();

const { t } = useI18n();

const sbCropperRef = ref<undefined | typeof SbCropper>(undefined);
const imageCropped = ref<string | null>(null);
const imageLoaded = ref<boolean>(false);

const titleComputed = computed((): string => {
  return props.title ?? t("adjustImage");
});

const handleCropperImageReady = (): void => {
  imageLoaded.value = true;
};

const cancelCropperHandleClicked = (): void => {
  if (!sbCropperRef.value) return;

  sbCropperRef.value.resetCropper();
};

const okCropperHandleClicked = (): void => {
  if (imageCropped.value) {
    emit("cropped", imageCropped.value);
  }
  props.disclosable?.close();
};

const croppedFailed = (): void => {
  emit("crop-failed");
};

const croppedHandleEvent = (urlImageBlob: string): void => {
  imageCropped.value = urlImageBlob;
};
</script>

<style lang="scss">

.sb-crop-dialog {
  --sb-dialog-bg-color: #222222 !important;

  .crop-container {
    align-items: center;
    gap: var(--sb-dialog-body-padding);

    .advise {
      background-color: #4e4e4e;
      border-radius: 10px;
      color: rgba(255, 255, 255);
      gap: 10px;
      padding: 10px;
      text-align: center;
    }
  }
}

</style>