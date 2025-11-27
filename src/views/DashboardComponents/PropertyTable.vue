<template>

<!--<div style="margin-bottom: 10px; white-space: pre-wrap">
  {{ addresses }}
</div>-->


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


<el-table-column label="Prix Estimé" prop="dernier_prix_estime" sortable min-width="120">
  <template #default="{ row }">
    <span :style="{color: row.price ? 'green' : 'blue', fontWeight: 'bold'  }"  >


      {{ formatPrice(row.price || row.dernier_prix_estime) }}
</span>

  </template>
</el-table-column>

    <el-table-column label="Contact" prop="date_rappel" sortable min-width="120">
  <template #default="{ row }">


    <div style="display:flex; align-items:center; gap:6px;">
  <img :src="getWeatherIcon(row.date_rappel)" alt="météo"
       width="24" height="24" style="display:block; margin-right:6px;" />
  <span style="line-height:1;"  :style="{
    color:
      getWeatherLabel(row.date_rappel).includes('eviter') ? 'red'
      : getWeatherLabel(row.date_rappel).includes('mois') ? 'orange'
      : 'green'
  }">{{ getWeatherLabel(row.date_rappel) }}</span>
</div>


  </template>
</el-table-column>

    <el-table-column fixed="right" label="Actions" min-width="140">
      <template #default="{ row }">
        <div class="action-buttons">
          <el-button 

            @click.stop="toggleFavorite(row)"

              :type="row.favorite === 'true' || row.favorite === true ? 'warning' : 'default'"
            size="small"
            circle
          >
            <el-icon>
               <StarFilled v-if="row.favorite === 'true' || row.favorite === true" />
              <Star v-else />
            </el-icon>
          </el-button>
          <el-button 
            type="primary" 
            size="small" 
            @click="$emit('edit-property', row)"
          >
            Ouvrir
          </el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">

//ICONE
import soleil from '@/assets/soleil.png'
import soleilNuage from '@/assets/soleil-nuage.png'
import nuage from '@/assets/nuage.png'
import nuagePluie from '@/assets/nuage-pluie.png'
import orage from '@/assets/orage.png'
import { Setting, Star, StarFilled } from '@element-plus/icons-vue';
import { House, OfficeBuilding, QuestionFilled } from '@element-plus/icons-vue'
import { usePropertyStore } from '@/stores/propertyHome';
import { ElMessage } from 'element-plus';
import { useDashboardStore } from '@/stores/dashboard';

import { ref } from "vue";
const selectedId = ref<string | null>(null);

function getMonthsDiff(dateRappel: string | null): number {
  if (!dateRappel) return -1
  const rappel = new Date(dateRappel)
  const now = new Date()
  return (now.getFullYear() - rappel.getFullYear()) * 12 + (now.getMonth() - rappel.getMonth())
}

function getWeatherIcon(dateRappel: string | null): string {
  const diff = getMonthsDiff(dateRappel)
  if (diff < 0 || diff < 1) return soleil
  if (diff < 3) return soleilNuage
  if (diff < 6) return nuage
  if (diff < 12) return nuagePluie
  return orage
}

function getWeatherLabel(dateRappel: string | null): string {
  const diff = getMonthsDiff(dateRappel)
  if (diff < 0) return 'Immediat'
  if (diff < 1) return 'Immediat'
  if (diff < 3) return '1 mois'
  if (diff < 6) return '3 mois'
  if (diff < 12) return '6 mois'
  return 'A eviter'
}


const store = usePropertyStore();

const dashboardStore = useDashboardStore();

defineProps({
  addresses: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['edit-property']);

const handleRowClick = (row: any) => {
  emit('edit-property', row);
};

const sortByNumeroAndRep = (a: { numero: string; rep: any; }, b: { numero: string; rep: any; }) => {
const numA = parseInt(a.numero) || 0;
const numB = parseInt(b.numero) || 0;

if (numA !== numB) {
  return numA - numB;
}

const repA = (a.rep || '').toLowerCase();
const repB = (b.rep || '').toLowerCase();

return repA.localeCompare(repB);
};

//const getRowClass = () => 'custom-row';

const getRowClass = (row: any) => {
  return row.id_fantoir_long === selectedId.value
    ? 'custom-row selected-row'
    : 'custom-row';
};

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



const toggleFavorite = async (row: any) => {
  try {
    const newState = await store.toggleFavorite(row.id_fantoir_long, row);

    ElMessage.success(newState ? "Ajouté aux favoris" : "Retiré des favoris");

    //row.favorite = newState;
    row.favorite = newState ? 'true' : 'false';

    dashboardStore.updateAddress({
      ...row,
      favorite: row.favorite,
    });

  } catch (e) {
    console.error("toggleFavorite error:", e);
    ElMessage.error("Impossible de modifier le favori");
  }
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

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

</style>