<template>
    <el-table 
      :data="addresses" 
      class="w-full"
      :default-sort="{ prop: 'numero', order: 'ascending' }"
    >
      <el-table-column label="Numero" prop="numero" sortable>
        <template #default="{ row }">
          {{ row.numero }} {{ row.rep || '' }}
        </template>
      </el-table-column>
  
      <el-table-column label="Rue" prop="nom_voie" sortable>
        <template #default="{ row }">
          {{ row.nom_voie }}
        </template>
      </el-table-column>
  
      <el-table-column label="Type" prop="type_bien" sortable>
        <template #default="{ row }">
          {{ row.type_bien }} {{ row.numero_appartement || '' }}
        </template>
      </el-table-column>
  
      <el-table-column label="Surface" prop="surface_reelle_bati" sortable>
        <template #default="{ row }">
          {{ row.surface_reelle_bati }}
        </template>
      </el-table-column>
  
      <el-table-column label="Nb pieces" prop="nombre_pieces_principales" sortable>
        <template #default="{ row }">
          {{ row.nombre_pieces_principales }}
        </template>
      </el-table-column>
  
      <el-table-column label="Terrain" prop="surfaceTerrain" sortable>
        <template #default="{ row }">
          {{ row.surfaceTerrain }}
        </template>
      </el-table-column>
  
      <el-table-column label="Nb vente" prop="nombre_ventes" sortable>
        <template #default="{ row }">
          {{ row.nombre_ventes }}
        </template>
      </el-table-column>
  
      <el-table-column label="Date vente" prop="date_derniere_vente" sortable>
        <template #default="{ row }">
          {{ row.date_derniere_vente }}
        </template>
      </el-table-column>
  
      <el-table-column label="Prix vente" prop="dernier_prix_vente" sortable>
        <template #default="{ row }">
          {{ row.dernier_prix_vente }}
        </template>
      </el-table-column>
  
      <el-table-column label="Actions" width="100">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small" 
            @click="$emit('edit-property', row)"
          >
            <Setting class="w-5 h-5" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </template>
  
  <script setup lang="ts">
  import { Setting } from '@element-plus/icons-vue';
  
  defineProps({
    addresses: {
      type: Array,
      default: () => []
    }
  });
  
  defineEmits(['edit-property']);
  </script>