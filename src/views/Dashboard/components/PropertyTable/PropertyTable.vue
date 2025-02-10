<template>
    <div class="overflow-x-auto bg-red-300">
      <el-table
        :data="data"
        class="min-w-full bg-white rounded-lg shadow-sm"
        fit
        :default-sort="{ prop: 'numero', order: 'ascending' }"
      >
        <el-table-column label="Numero" prop="numero" sortable :sort-method="sortByNumeroAndAppartement">
          <template #default="{ row }">
            <div>{{ row.numero + ' ' + row.rep }}</div>
          </template>
        </el-table-column>yo
  
        <el-table-column label="Rue" prop="nom_voie" sortable>
          <template #default="{ row }">
            <div>{{ row.nom_voie }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Type" prop="type_bien" sortable>
          <template #default="{ row }">
            <div>{{ row.type_bien + ' ' + row.numero_appartement }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Surface" prop="surface_reelle_bati" sortable>
          <template #default="{ row }">
            <div>{{ row.surface_reelle_bati }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Nb pieces" prop="nombre_pieces_principales" sortable>
          <template #default="{ row }">
            <div>{{ row.nombre_pieces_principales }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Terrain" prop="surfaceTerrain" sortable>
          <template #default="{ row }">
            <div>{{ row.surfaceTerrain }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Nb vente" prop="nombre_ventes" :min-width="90" sortable>
          <template #default="{ row }">
            <div>{{ row.nombre_ventes }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Date vente" prop="date_derniere_vente" sortable>
          <template #default="{ row }">
            <div>{{ row.date_derniere_vente }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Prix vente" prop="dernier_prix_vente" :min-width="90" sortable>
          <template #default="{ row }">
            <div>{{ row.dernier_prix_vente }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Nb estime" prop="nombre_estimations" :min-width="90" sortable>
          <template #default="{ row }">
            <div>{{ row.nombre_estimations }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Date estime" prop="date_derniere_estimation" sortable>
          <template #default="{ row }">
            <div>{{ row.date_derniere_estimation }}</div>
          </template>
        </el-table-column>
  
        <el-table-column label="Prix estime" prop="dernier_prix_estime" :min-width="90" sortable>
          <template #default="{ row }">
            <div>{{ row.dernier_prix_estime }}</div>
          </template>
        </el-table-column>
  
        <el-table-column style="width: max-content" header-align="center" :width="50">
          <template #default="{ row }">
            <el-button squared text type="primary" size="small" 
            @click="() => {
  console.log('Row Data:', row); // Debugging
  props.onPropertySelect(row);
}"
            >
              <Setting class="setting-icon" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script setup lang="ts">
  import { Setting } from '@element-plus/icons-vue';
  
  interface Property {
    numero: string;
    rep: string;
    nom_voie: string;
    type_bien: string;
    numero_appartement: string;
    surface_reelle_bati: number;
    nombre_pieces_principales: number;
    surfaceTerrain: number;
    nombre_ventes: number;
    date_derniere_vente: string;
    dernier_prix_vente: number;
    nombre_estimations: number;
    date_derniere_estimation: string;
    dernier_prix_estime: number;
  }
  
  const props = defineProps<{
    data: Property[];
    onPropertySelect: (property: Property) => void;
  }>();
  
  const sortByNumeroAndAppartement = (a: Property, b: Property) => {
    const numeroA = parseInt(a.numero) || 0;
    const numeroB = parseInt(b.numero) || 0;
  
    if (numeroA !== numeroB) {
      return numeroA - numeroB;
    }
  
    const appartementA = parseInt(a.numero_appartement) || 0;
    const appartementB = parseInt(b.numero_appartement) || 0;
  
    return appartementA - appartementB;
  };
  </script>
  
  <style scoped>
  .setting-icon {
    width: 20px;
    height: 20px;
  }
  
  .setting-icon:hover {
    color: #ffffff;
  }
  </style>