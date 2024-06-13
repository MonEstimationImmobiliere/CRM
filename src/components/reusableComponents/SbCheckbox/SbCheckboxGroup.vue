<template>
  <ElCheckboxGroup
    class="sb-checkbox-group"
    :class="{'is-wrapped': props.wrapped}"
    v-model="checkList"
  >
      <template v-for="prop in props.props">
        <el-checkbox :label="prop.name" :value="prop.name" />
      </template>
  </ElCheckboxGroup>
</template>

<script setup lang="ts">
import { ElCheckboxGroup } from "element-plus";
import { defineProps, withDefaults } from "vue";
import { ref } from 'vue'

const checkList = ref([])

const props = withDefaults(
  defineProps<{
    wrapped?: boolean;
    props?: any;
  }>(),
  {
    wrapped: false,
    props: [],
  }
);

</script>

<style scoped lang="scss">
.sb-checkbox-group {
  font-size: inherit;
  line-height: inherit;
  width: 100%;

  section {
    align-items: initial;
    display: flex;
    flex-direction: inherit;
    flex-wrap: wrap;
    gap: 5px;
  }
}
</style>
