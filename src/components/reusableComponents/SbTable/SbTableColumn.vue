<template>
  <ElTableColumn class-name="sb-table-column">
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <!--
        Check is $index > -1 to fix an element-plus issue
        https://github.com/element-plus/element-plus/issues/10739
      -->
      <template v-if="slot !== 'default' || scope.$index > -1">
        <slot :name="slot" v-bind="scope" />
      </template>
    </template>
  </ElTableColumn>
</template>

<script setup lang="ts">
import { ElTableColumn } from "element-plus";

</script>

<style lang="scss">
.sb-table-column {
  .cell {
    word-break: normal;
  }
}
</style>
