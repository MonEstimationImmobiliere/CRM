<template>



    <el-table 
      :data="addresses" 
      class="w-full Tableau"
      :default-sort="{ prop: 'numero', order: 'ascending' }"
      height="80vh" 
      :row-class-name="'cursor-pointer'"
    >
      <el-table-column label="Ville" prop="city" sortable>
        <template #default="{ row }">
        {{ row.city }} {{ row.codePostal}}
        </template>
      </el-table-column>

      <el-table-column label="Numero" prop="numero" sortable :sort-method="sortByNumeroAndRep" :sort-orders="['ascending', 'descending']">
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
          {{ row.type_bien }} {{ row.apart_number || '' }}

       <!--   <el-icon v-if="row.type_bien === 'maison'"><House /></el-icon>
    <el-icon v-else-if="row.type_bien === 'appartement'"><OfficeBuilding /></el-icon>
    <el-icon v-else-if="row.type_bien === 'immeuble'"><OfficeBuilding /></el-icon>
    <el-icon v-else><QuestionFilled /></el-icon>

    <span v-if="row.apart_number"> - {{ row.apart_number }}</span>-->
        </template>
      </el-table-column>
  
      <el-table-column label="Surface" prop="surface_reelle_bati" sortable>
        <template #default="{ row }">
          {{ row.surface }}
        </template>
      </el-table-column>
  
      <el-table-column label="Nb chambres" prop="nombre_pieces_principales" sortable>
        <template #default="{ row }">
          {{ row.nombre_pieces_principales }}
        </template>
      </el-table-column>
  
      <el-table-column label="Terrain" prop="surfaceTerrain" sortable>
        <template #default="{ row }">
          {{ row.area }}
        </template>
      </el-table-column>
  
      <el-table-column label="Nb vente" prop="nombre_ventes" sortable>
        <template #default="{ row }">
          {{ row.nombre_ventes }}
        </template>
      </el-table-column>
  
      <el-table-column label="Dernière vente" prop="date_derniere_vente" sortable>
        <template #default="{ row }">
          {{ row.date_derniere_vente }}
        </template>
      </el-table-column>
  
      <el-table-column label="Prix de vente" prop="dernier_prix_vente" sortable>
        <template #default="{ row }">
          {{ row.dernier_prix_vente }}
        </template>
      </el-table-column>

      <el-table-column label="Date Estimation" prop="rappel" sortable>
        <template #default="{ row }">
          {{ row.rappel}}
        </template>
      </el-table-column>

      <el-table-column label="Prix Estimation" prop="maj" sortable>
        <template #default="{ row }">
          {{ row.maj }}
        </template>
      </el-table-column>

      <el-table-column label="Date Rappel" prop="rappel" sortable>
        <template #default="{ row }">
          {{ row.rappel}}
        </template>
      </el-table-column>

      <el-table-column label="Date Maj" prop="maj" sortable>
        <template #default="{ row }">
          {{ row.maj }}
        </template>
      </el-table-column>
  
  
      <el-table-column label="Actions" width="50">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small" 
            @click="$emit('edit-property', row)"
          >
            <!-- <Setting class="w-5 h-5 Icon" /> -->
             Ouvrir
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </template>
  
  <script setup lang="ts">
  import { Setting } from '@element-plus/icons-vue';
  //import { House, OfficeBuilding, QuestionFilled } from '@element-plus/icons-vue'
  
  defineProps({
    addresses: {
      type: Array,
      default: () => []
    }
  });
  
  const emit = defineEmits(['edit-property']);
  


  const sortByNumeroAndRep = (a, b) => {
  const numA = parseInt(a.numero) || 0;
  const numB = parseInt(b.numero) || 0;

  if (numA !== numB) {
    return numA - numB;
  }

  const repA = (a.rep || '').toLowerCase();
  const repB = (b.rep || '').toLowerCase();

  return repA.localeCompare(repB);
};

  </script>
  
  <style scoped>
  :deep(.cursor-pointer) {
    cursor: pointer;
  }
  :deep(.cursor-pointer:hover) {
    background-color: #f5f7fa;
  }

  .Tableau {
    border-radius: 8px;
    border: 1px solid #e4e7ed;
  }
  
  </style>