<template>

{{ selectedCodeInsee}}
{{ selectedCity }}
{{ selectedStreet }}

{{ addresses }}



  <SbPage :header="false" class="block app-dashboard-main" style="min-height: 100%; padding:5px;">


    <div style="display: grid; grid-template-columns: 1fr 2fr;">
        <SbTypography as="h6">Ville</SbTypography>
        <el-autocomplete :debounce="500" :suffix-icon="Search" :icon-size="60" v-model="stateAutocompleteCity" :fetch-suggestions="querySearchCity" :trigger-on-focus="false" clearable placeholder="Saisir" 
        @clear="handleClearCity" @select="handleSelectCity">
          <template #default="{ item }">
            <div class="" v-html="highlightMatchCity(item.value, stateAutocompleteCity) + ', ' + item.city" />
          </template>
        </el-autocomplete>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 2fr;">
        <SbTypography as="h6">Rue</SbTypography>
        <el-autocomplete :debounce="500" :suffix-icon="Search" :icon-size="60" v-model="stateAutocompleteStreet" :fetch-suggestions="querySearchStreet" :trigger-on-focus="false" clearable placeholder="Saisir" 
        @clear="handleClearStreet" @select="handleSelectStreet">
          <template #default="{ item }">
            <div class="" v-html="highlightMatchStreet(item.value, stateAutocompleteStreet) " />
          </template>
        </el-autocomplete>
      </div>

      <SbButton
          type="primary"
          @click="querySearchAddress"
        >
          Afficher
        </SbButton>




    <SbTable
    :data="Object.values(addresses)"
    class="SbTable"
    fit
    >
      <template #filters>
        <div class="justify-between align-items-center w-100 gap-10">
          <SbSelect v-model="testValeur" class="m-2" :placeholder="t('common.form.filter.selectPeriod')" size="medium"
            style="width: 200px">
            <SbSelectOption label="aujourd'hui" value="aujourd'hui" />
            <SbSelectOption label="demain" value="demain" />
            <SbSelectOption label="trois prochains jours" value="trois prochains jours" />
          </SbSelect>
          <!-- <SbAutocomplete v-model="database" placeholder="Rechercher" style="width: 50%" /> -->
          <!-- <SbButton :icon-size="25">
            Créer une commande
          </SbButton> -->
            <div class="container-filter-button">
              <SbButton type="info" @click="toggleDrawer" class="dashboard-button-filter">
                Filtrer
              </SbButton>
            </div>

          <DrawerFormFilter title="Filtrer" v-model="drawer" />

        </div>
      </template>

   

      <SbTableColumn label="numero" prop="numero" sortable >
        <template #default="{ row }">
          <div>{{ row.numero + ' ' +row.rep  }}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn label="Rue" prop="nom_voie" sortable>
        <template #default="{ row }">
          <div>{{ row.nom_voie }}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn label="Rues" prop="nom_voie"  >
        <template #default="{ row }">
          <div>{{ row.DateCharg }}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn label="Client" prop="Client">
        <template #default="{ row }">
          <div>{{ row.Client }}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn label="Véhicules" prop="Véhicules" :min-width=90>
        <template #default="{ row }">
          <div>{{ row.Véhicules }}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn style="width: max-content;" header-align="center" align="center">
        <template #default="{ row }">
          <SbButton squared text type="primary" >
<Setting class="setting-icon"/>
</SbButton>
        </template>
      </SbTableColumn>
    </SbTable>

  </SbPage>
</template>

<script setup lang="ts">
import { i18n } from "@/locales";
import { ref, Ref, reactive } from "vue";
import DrawerFormFilter from '@/layout/DrawerFormFilter.vue';
import {
  Setting,
  Delete
} from "@element-plus/icons-vue";



import axios from 'axios';
import { useRouter } from 'vue-router';


import API_URL from '@/utils/API_URL';

//import { form } from './sharedVariables';



const variableDebug = ref();

const stateAutocompleteCity = ref('');

const stateAutocompleteStreet = ref('');

interface addressItem {
  value: string,
  city: string,
  codeInsee: string
}


/*interface selectedCity {
  value: string,
  city: string,
  codeInsee: string
}*/
//const city = ref([]);


const t = i18n.global.t;


const addresses = ref([{}]);

const selectedCity = ref([]);

const selectedCodeInsee = ref<string>('');
const selectedCodeIdFantoir = ref<string>('');


const selectedStreet = ref([]);


const querySearchAddress2 = async (queryString: string, cb: any) => {
try {
  const response = await axios.get(`${API_URL}/addresses/${selectedCodeInsee.value}`)
  const data = response.data
  let results = []
      results = data.map((item: any) => ({
        value: item.nom_voie,
        numero: item.numero
    }))
  cb(results)
} catch (error) {
  console.error('Error fetching data:', error)
  cb([]) // Return an empty array in case of error
}
};

 const querySearchAddress = async () => {
  try {      
    const url = `${API_URL}/addresses/${selectedCodeIdFantoir.value}`;
    const response = (await axios.get(url));

    addresses.value = response.data;


  } catch (error) {
    console.error(error);
  }
};


const querySearchCity = async (queryString: string, cb: any) => {
try {
  const response = await axios.get(`${API_URL}/communes/${queryString}`)
  const data = response.data

  let results = []
  let queryStringBeANumber = parseInt(queryString)
  if (isNaN(Number(queryStringBeANumber))) {
    
    results = data.map((item: any) => ({
      value: item.code_postal,
      city: item.nom_commune,
      codeInsee: item.code_insee,

    }))

    //city.value = results;

  } else  {
    if (queryString.length == 5) {
      results = data.map((item: any) => ({
        value: item.nom_commune,
        city: item.code_postal,
        codeInsee: item.code_insee
    }))
    //city.value = results;
  }
  else cb([])
  }
  cb(results)
} catch (error) {
  console.error('Error fetching data:', error)
  cb([]) // Return an empty array in case of error
}
}

const querySearchStreet = async (queryString: string, cb: any) => {

    try {
      const response = await axios.get(`${API_URL}/addresses/${selectedCodeInsee.value}/nom_voie/${queryString}`)
      const data = response.data

      let results = []

        if (queryString.length >= 3) {
          results = data.map((item: any) => ({
            value: item.nom_voie,
            idFantoir: item.id_fantoir

        }))

      }

      cb(results)

      
    } catch (error) {
      console.error('Error fetching data:', error)
      cb([]) // Return an empty array in case of error
    }

}





const highlightMatchCity = (value: string, query: string) => {
  const index = value.toLowerCase().indexOf(query.toLowerCase());

  if (index !== -1) {
    const beforeMatch = value.substring(0, index);
    const matched = value.substring(index, index + query.length);
    const afterMatch = value.substring(index + query.length);
    return `${beforeMatch}<b>${matched}</b>${afterMatch}`;
  }
  return value;
};

const highlightMatchStreet = (value: string, query: string) => {
  const index = value.toLowerCase().indexOf(query.toLowerCase());

  if (index !== -1) {
    const beforeMatch = value.substring(0, index);
    const matched = value.substring(index, index + query.length);
    const afterMatch = value.substring(index + query.length);
    return `${beforeMatch}<b>${matched}</b>${afterMatch}`;
  }
  return value;
};






const handleSelect = (item: addressItem) => {
  /*router.push({
    name: 'Form',
    params: { postCode: item.value, city: item.city, codeInsee: item.codeInsee }
  })*/
}

const handleSelectCity = (selectedItem: any): void => {
  selectedCity.value = selectedItem;

  selectedCodeInsee.value = selectedItem.codeInsee;

  stateAutocompleteCity.value = selectedItem.value + ', ' + selectedItem.city;
};

const handleSelectStreet = (selectedItem: any): void => {
  selectedStreet.value = selectedItem;

  selectedCodeIdFantoir.value = selectedItem.idFantoir;
  //stateAutocomplete.value = selectedItem.value + ', ' + selectedItem.city;
};

const handleClearCity = () => {
  selectedCity.value = [];
};

const handleClearStreet = () => {
  selectedStreet.value = [];
};


/*********************************************************************** */
/************************  Gestion drawer START ************************* */
/*********************************************************************** */

const drawer = ref(false);

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

/*********************************************************************** */
/************************  Gestion drawer END     ************************* */
/*********************************************************************** */

const testValeur = ref("");
console.log("testValeur", testValeur.value);


  
 
  

</script>

<style lang="scss" scoped>
.app-dashboard-header {
  // background-color: #86b1dd;
  border: 1px solid #86b1dd;
  display: flex;
  gap: 10px;
}

.test {
  width: 500px;
  background-color: #86b1dd;
  gap: 10px;
  display: flex;
  justify-content: center;
}

.collapse {
  border-color: #ffffff;
  padding: 20px;
}

.container-filter-button {
  display: flex;
  // justify-content: flex-end;
  margin: 10px;
}


.dashboard-button-filter {
  background-color: #ffffff;
  color: (var(--blue));
  font-weight: bolder;
  border: 1.5px solid (var(--blue));
  border-radius: 15px;
  padding: 5px 15px;
}

.dashboard-button-filter:hover {
  background-color: (var(--blue));
  color: #ffffff;
}

.SbTable {
  width: 100%;

}
.setting-icon {
  width: 20px;
  height: 20px;
}

.setting-icon:hover {
  color: #ffffff;
}

</style>
