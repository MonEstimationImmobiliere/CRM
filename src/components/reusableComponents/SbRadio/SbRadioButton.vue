<template>
  <ElRadioButton
    ref="radioRef"
    class="sb-radio"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ElRadioButton>
</template>

<script setup lang="ts">
import { ElRadioButton } from "element-plus";

</script>

<style scoped lang="scss">
</style>
