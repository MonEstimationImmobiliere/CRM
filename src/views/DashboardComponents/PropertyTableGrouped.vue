<template>
  <div class="tableWrapper">
    <el-table
      :data="rows"
      style="width: 100%"
      highlight-current-row
    >
      <el-table-column prop="nom_voie" label="Rue" width="260" />
      <el-table-column prop="code_postal" label="CP" width="100" />
      <el-table-column prop="count" label="Nb adresses" width="140" />

      <el-table-column fixed="right" label="Actions" width="180">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="$emit('open-street', row)"
          >
            Afficher adresses
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
defineProps({
  rows: {
    type: Array,
    required: true
  }
});

defineEmits(["open-street"]);
</script>

<style scoped>
.tableWrapper {
  margin-top: 24px;
}
</style>
