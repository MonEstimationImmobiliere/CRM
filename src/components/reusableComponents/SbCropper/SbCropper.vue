<template>
  <div class="sb-cropper">
    <cropper
      ref="cropperRef"
      class="cropper"
      :src="props.image"
      :stencil-props="{
        aspectRatio: props.aspectRatio
      }"
      :canvas="{
        fillColor: '#FFFFFF',
        maxWidth: 500,
        maxHeight: 500
      }"
      :default-size="defaultSize"
      v-bind="$attrs"
      @ready="handleCropperImageReady"
      @change="handleCropChange"
    />
  </div>
</template>

<script lang="ts" setup>

import "vue-advanced-cropper/dist/style.css";

import { ref } from "vue";
import { Cropper } from "vue-advanced-cropper";

const props = defineProps<{
  image: string;
  aspectRatio?: number;
}>();

const emit = defineEmits<{
  (e: "cropped", imageCropped: string): void;
  (e: "crop-failed"): void;
  (e: "ready"): void;
}>();

const handleCropperImageReady = (): void => {
  emit("ready");
};

const cropperRef = ref<undefined | typeof Cropper>(undefined);

const resetCropper = (): void => {
  if (!cropperRef.value) {
    return;
  }
  cropperRef.value.reset();
};

const defaultSize = ({ imageSize, visibleArea }): { width: number; height: number } => {
  return {
    width: (visibleArea || imageSize).width,
    height: (visibleArea || imageSize).height
  };
};

const handleCropChange = ({ canvas }: { canvas: HTMLCanvasElement | undefined | null }): void => {
  if (!canvas) {
    emit("crop-failed");
    return;
  }

  emit("cropped", canvas.toDataURL());
};

defineExpose({
  resetCropper
});

</script>

<style lang="scss" scoped>
.sb-cropper {
  width: 100%;
}
</style>