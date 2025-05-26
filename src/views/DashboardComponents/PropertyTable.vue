<template>



  <el-table 
    :data="addresses" 
    class="TableContainer"
    :default-sort="{ prop: 'numero', order: 'ascending' }"
    height="80vh" 
    :row-class-name="getRowClass"
    @row-click="handleRowClick"

  >
    <el-table-column label="Ville" prop="city" sortable  min-width="120">
      <template #default="{ row }">
      {{ row.nom_commune}} {{ row.codePostal}}
      </template>
    </el-table-column> 



    <el-table-column label="N°" prop="numero" sortable  min-width="100" :sort-method="sortByNumeroAndRep" :sort-orders="['ascending', 'descending']">
      <template #default="{ row }">
 

      {{ row.numero }} {{ row.rep || '' }}
      </template>
    
    </el-table-column>

    <el-table-column label="Rue" prop="nom_voie" sortable  min-width="120">
      <template #default="{ row }">
        {{ row.nom_voie }}
      </template>
    </el-table-column> 

    <el-table-column label="Type" prop="type_bien" sortable  min-width="100">
      <template #default="{ row }">
      <!--  {{ row.type_bien }} {{ row.apart_number || '' }}-->

  <el-icon class="icon-maison" v-if="row.type_bien === 'Maison'"><House /></el-icon>
  <el-icon class="icon-appartement" v-else-if="row.type_bien === 'Appartement'"><OfficeBuilding /></el-icon>
  <el-icon class="icon-immeuble" v-else-if="row.type_bien === 'Immeuble'"><OfficeBuilding /></el-icon>
  <el-icon class="icon-inconnu" v-else><QuestionFilled /></el-icon>
  <span v-if="row.apart_number">/{{ row.apart_number }}</span>


      </template>
    </el-table-column>

    <el-table-column label="Surface" prop="surface_reelle_bati" sortable  min-width="100">
      <template #default="{ row }">
             {{ formatMetrage(row.surface) }}
      </template>
    </el-table-column>

    <el-table-column label="Chambres" prop="bedrooms" sortable  min-width="120">
      <template #default="{ row }">
        {{ row.bedrooms }}
      </template>
    </el-table-column>

     <el-table-column label="Terrain" prop="surfaceTerrain" sortable  min-width="120">
      <template #default="{ row }">
  {{ formatMetrage(row.area) }}
      </template>
    </el-table-column> -

    <!--<el-table-column label="Nb vente" prop="nombre_ventes" sortable  min-width="120">
      <template #default="{ row }">
        {{ row.nombre_ventes }}
      </template>
    </el-table-column>-->

    <el-table-column label="Dernière vente" prop="date_derniere_vente" sortable min-width="120">
      <template #default="{ row }">
       <!-- {{ row.date_derniere_vente }}<span v-if="row.nombre_ventes"> ({{ row.nombre_ventes }})</span> -->

         {{ formatDate(row.date_derniere_vente) }}
      </template>
    </el-table-column>



    <el-table-column label="Prix vendu" prop="dernier_prix_vente" sortable min-width="120">
  <template #default="{ row }">  
     {{ formatPrice(row.dernier_prix_vente) }}
  </template>
</el-table-column>

<!--<el-table-column label="Date Estimation" prop="date_derniere_estimation" sortable min-width="120">
  <template #default="{ row }">
    {{ formatDate(row.date_derniere_estimation) }}
  </template>
</el-table-column>-->

<el-table-column label="Prix Estimé" prop="dernier_prix_estime" sortable min-width="120">
  <template #default="{ row }">
    {{ formatPrice(row.dernier_prix_estime) }}
  </template>
</el-table-column>

    <el-table-column label="Date Maj" prop="date_maj" sortable  min-width="120" >
      <template #default="{ row }">
            {{ formatDate(row.date_maj ) }}
      </template>
    </el-table-column> 


    <el-table-column label="Date Rappel" prop="date_rappel" sortable min-width="120">
  <template #default="{ row }">
    <span :style="{ color: isDatePassed(row.date_rappel) ? 'red' : 'inherit' }">
      {{ formatDate(row.date_rappel) }}
    </span>
  </template>
</el-table-column>



    <el-table-column fixed="right" label="Actions" min-width="80">
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
import { House, OfficeBuilding, QuestionFilled } from '@element-plus/icons-vue'

defineProps({
  addresses: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['edit-property']);

const handleRowClick = (row) => {
  emit('edit-property', row);
};

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

const getRowClass = () => 'custom-row';

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatPrice = (value: number | null) => {
  if (!value) return '';
  return `${Math.round(value).toLocaleString('fr-FR')} €`;
};

const isDatePassed = (dateStr: string | Date | null): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // ignore heure/minute
  return date < today;
};

const formatMetrage = (value: number | null) => {
  if (!value) return '';
  return `${Math.round(value).toLocaleString('fr-FR')} m²`;
};


</script>

<style scoped>

:deep(.el-table__body-wrapper) {
  padding: 10px 0;
}

:deep(.el-table__row.custom-row) {
  cursor: pointer;

  background-color: white;
  border-radius: 12px;
  box-shadow: 0 0 0 transparent;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  margin-bottom: 10px; /* ne fonctionne pas sur tr, mais on contourne avec box-shadow + padding */
}

:deep(.el-table__row.custom-row:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
  background-color: #f5f7fa;
}

:deep(.el-table__row.custom-row > td) {
  background-color: transparent !important;
  border: none;
  padding-top: 16px;
  padding-bottom: 16px;

  /* Taille du texte */
  font-size: 16px; /* Ajuste à ta convenance */
  font-weight: 500; /* Optionnel pour un style plus lisible */
  color: #333;
  font-family: 'Segoe UI', sans-serif;

}


.TableContainer {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  width: 100%;
}


.icon-maison {
font-size: 24px;
  color: green;
}

.icon-appartement {
font-size: 24px;
  color: blue;
}

.icon-immeuble {
font-size: 24px;
  color: brown;
}

.icon-inconnu {
font-size: 24px;
  color: black;
}



</style>