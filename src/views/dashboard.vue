<template>

  <SbPage :header="false" class="block app-dashboard-main" style="min-height: 100%; padding:5px;">

    {{  formAddress }}

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

        <SbButton
          type="primary"
          @click="querySearchAddress"
        >
          Estimations
        </SbButton>
    
        <SbTable
    :data="Object.values(addresses)"
    class="SbTable"
    fit
     :default-sort="{ prop: 'numero', order: 'ascending' }"
    >
    <!--  <template #filters>
        <div class="justify-between align-items-center w-100 gap-10">
          <SbSelect v-model="testValeur" class="m-2" :placeholder="t('common.form.filter.selectPeriod')" size="medium"
            style="width: 200px">
            <SbSelectOption label="aujourd'hui" value="aujourd'hui" />
            <SbSelectOption label="demain" value="demain" />
            <SbSelectOption label="trois prochains jours" value="trois prochains jours" />
          </SbSelect>-->
          <!-- <SbAutocomplete v-model="database" placeholder="Rechercher" style="width: 50%" /> -->
          <!-- <SbButton :icon-size="25">
            Créer une commande
          </SbButton> -->
      <!--      <div class="container-filter-button">
              <SbButton type="info" @click="toggleDrawer" class="dashboard-button-filter">
                Filtrer
              </SbButton>
            </div>

          <DrawerFormFilter title="Filtrer" v-model="drawer" />
        </div>
      </template>-->   
  
      <SbTableColumn label="Numero" prop="numero" sortable :sort-method="sortByNumeroAndAppartement">
        <template #default="{ row }">
          <div>{{ row.numero + ' ' +row.rep }}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn label="Rue" prop="nom_voie" sortable>
        <template #default="{ row }">
          <div>{{ row.nom_voie }}</div>
        </template>
      </SbTableColumn>

      
      <SbTableColumn label="Type" prop="type_bien" sortable>
        <template #default="{ row }">
          <div>{{ row.type_bien  + ' ' +row.numero_appartement}}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn label="Surface" prop="surface_reelle_bati" sortable>
        <template #default="{ row }">
          <div>{{ row.surface_reelle_bati}}</div>
        </template>
      </SbTableColumn>
      
      <SbTableColumn label="Nb pieces" prop="nombre_pieces_principales" sortable>
        <template #default="{ row }">
          <div>{{ row.nombre_pieces_principales}}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn label="Terrain" prop="surfaceTerrain" sortable>
        <template #default="{ row }">
          <div>{{ row.surfaceTerrain}}</div>
        </template>
      </SbTableColumn>


      <SbTableColumn label="Nb vente" prop="nombre_ventes" :min-width=90 sortable>
        <template #default="{ row }">
          <div>{{ row.nombre_ventes }}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn label="Date vente" prop="date_derniere_vente" sortable >
        <template #default="{ row }">
          <div>{{ row.date_derniere_vente }}</div>
        </template>
      </SbTableColumn>
 
      <SbTableColumn label="Prix vente" prop="dernier_prix_vente" :min-width=90 sortable>
        <template #default="{ row }">
          <div>{{ row.dernier_prix_vente }}</div>
        </template>
      </SbTableColumn>
    
      
      <SbTableColumn label="Nb estime" prop="nombre_estimations" :min-width=90 sortable>
        <template #default="{ row }">
          <div>{{ row.nombre_estimations }}</div>
        </template>
      </SbTableColumn>

      <SbTableColumn label="Date estime" prop="date_derniere_estimation" sortable >
        <template #default="{ row }">
          <div>{{ row.date_derniere_estimation }}</div>
        </template>
      </SbTableColumn>
 
      <SbTableColumn label="Prix estime" prop="dernier_prix_estime" :min-width=90   sortable>
        <template #default="{ row }">
          <div>{{ row.dernier_prix_estime }}</div>
        </template>
      </SbTableColumn>



      <SbTableColumn style="width: max-content;" header-align="center" :width=50>
        <template #default="{ row }">
          <SbButton squared text type="primary"  size="small" @click="toggleDialogVisibility(row);" >
<Setting class="setting-icon"/>
</SbButton>
        </template>
      </SbTableColumn>
    </SbTable>

  </SbPage>




  <el-dialog  v-model="dialogPropertyVisible" :title="`${formAddress.numero}${formAddress.rep ? ` ${formAddress.rep}` : ''} - ${formAddress.nom_voie}${formAddress.numero_appartement ? ` - Appartement ${formAddress.numero_appartement}` : ''}`" width="80%">
  <el-form :model="formProperty">

    Contenu de formAddress: {{  formAddress }}  <br>
    Variable property_idFantoirLong: {{  property_idFantoirLong }}  <br>
    Contenu de formProperty: {{formProperty}}  <br>
    Varible debug: {{  variableDebug }}  <br>
       
     <SbTypography as="label">Propriétaire</SbTypography>
     <SbInput size="small" v-model="formProperty.owner"></SbInput>

      <SbTypography as="label">Mail</SbTypography>
      <SbInput size="small" v-model="formProperty.email" :formatter="(value) => value.toLowerCase()" :parser="(value) => value.trim()"></SbInput>

      <SbTypography as="label">Téléphone</SbTypography>
      <SbInput size="small" v-model="formProperty.phone" :formatter="(value) => value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ')" :parser="(value) => value.replace(/\D/g, '').substring(0, 10)"> </SbInput>
      
      <el-radio-group v-model="formProperty.property_type" size="large" required>
        <el-radio-button class="houseType" label="Maison" value="maison"/>
        <el-radio-button class="houseType" label="Appartement" value="appartement" />
      </el-radio-group>

      <SbTypography for="year_built">Année de construction</SbTypography>
      <SbInput size="small" v-model="formProperty.year_built" type="number"></SbInput>

      <SbTypography for="year_buy">Année d'acquisition</SbTypography>
      <SbInput size="small" v-model="formProperty.year_buy" type="number"></SbInput>  

      <SbTypography for="year_buy">Surface</SbTypography>
      <SbInput size="small" v-model="formProperty.surface" type="number"></SbInput>

      <SbTypography for="year_buy">Terrain</SbTypography>
      <SbInput size="small" v-model="formProperty.area" type="number"></SbInput>


      <SbTypography for="orientation">Orientation</SbTypography>
      <el-radio-group size="large" v-model="formProperty.orientation" required>
        <el-radio-button class="orientation" label="Nord" value="nord" />
        <el-radio-button class="orientation" label="Sud" value="sud" />
        <el-radio-button class="orientation" label="Est" value="est" />
        <el-radio-button class="orientation" label="Ouest" value="ouest" />
      </el-radio-group>

  
  <SbTypography>Etat général</SbTypography>

  <el-radio-group size="large" v-model="formProperty.property_condition" required>
    <el-radio-button label="Travaux à réaliser" value="travaux" />
    <el-radio-button label="Rafraichissement" value="rafraichissement" />
    <el-radio-button label="Pas de travaux" value="pas de travaux" />
  </el-radio-group>
 
  <SbTypography for="year_buy">Chambres</SbTypography>
  <SbInput size="small" v-model="formProperty.bedrooms" type="number"></SbInput>

  <SbTypography for="year_buy">Salles de bains</SbTypography>
  <SbInput size="small" v-model="formProperty.bathrooms" type="number"></SbInput>

  <label for="fitted_kitchen">Cuisine aménagée</label>
  <input type="checkbox" class="checkbox " id="fitted_kitchen" v-model="formProperty.fitted_kitchen" />

  <label for="equipped_kitchen">Cuisine équipée</label>
  <input type="checkbox" class="checkbox " id="equipped_kitchen" v-model="formProperty.equipped_kitchen" />

  <label for="american_kitchen">Cuisine américaine</label>
  <input type="checkbox" class="checkbox " id="american_kitchen" v-model="formProperty.american_kitchen" />

  <label for="scullery">Arrière-cuisine</label>
  <input type="checkbox" class="checkbox " id="scullery" v-model="formProperty.scullery" />

      
      <SbTypography>Chauffage</SbTypography>

        <select  v-model="formProperty.heating_type">
          <option value="fuel">Fuel</option>
          <option value="elec">Électricité (radiateur)</option>
          <option value="pompe_a_chaleur">Pompe à chaleur</option>
          <option value="gaz">Gaz</option>
          <option value="cheminee">Cheminée</option>
          <option value="poele">Poêle</option>
        </select>
   
  

            
      <SbTypography>Epaisseur des fenêtres</SbTypography>
     
        <el-radio-group v-model="formProperty.window" size="large" required>
          <el-radio-button label="Simple" value="simple" />
          <el-radio-button label="Double" value="double" />
          <el-radio-button label="Triple" value="triple" />
        </el-radio-group>


 
        <SbTypography>Type de fenêtres</SbTypography>
        <el-radio-group
          v-model="formProperty.window_type"
          size="large"
          required
        >
          <el-radio-button label="Pvc" value="pvc" />
          <el-radio-button label="Bois" value="bois" />
          <el-radio-button label="Alu" value="aluminium" />
        </el-radio-group>


        <SbTypography>Type de volets</SbTypography>

        <el-radio-group v-model="formProperty.shutter" size="large" required>
          <el-radio-button label="Electrique" value="roulant_elec" />
          <el-radio-button label="Manuel" value="roulant_manuel" />
          <el-radio-button label="À battant" value="battant" />
        </el-radio-group>

       <ElCheckbox for="cheminee" label="Cheminée d'appoint" v-model="formProperty.cheminee"></ElCheckbox>    
        <ElCheckbox for="cheminee" label="Chauffage collectif<" v-model="formProperty.district_heating"></ElCheckbox>    
        <ElCheckbox for="cheminee" label="Terrasse" v-model="formProperty.patio"></ElCheckbox>
        <ElCheckbox for="cheminee" label="Garage" v-model="formProperty.Garage"></ElCheckbox>
        <ElCheckbox for="cheminee" label="Piscine" v-model="formProperty.pool"></ElCheckbox>
        <ElCheckbox for="cheminee" label="Veranda" v-model="formProperty.veranda"></ElCheckbox>
        <ElCheckbox for="cheminee" label="Jardin" v-model="formProperty.garden"></ElCheckbox>
        <ElCheckbox for="cheminee" label="Parking privé" v-model="formProperty.parking"></ElCheckbox>    
        <ElCheckbox for="cheminee" label="Carport" v-model="formProperty.Carport"></ElCheckbox>   
        <ElCheckbox for="cheminee" label="Cuisine extérieur" v-model="formProperty.kitchen_ext"></ElCheckbox>
        <ElCheckbox for="cheminee" label="Ascenseur" v-model="formProperty.elevator"></ElCheckbox>        
        <ElCheckbox for="cheminee" label="Balcon" v-model="formProperty.balcony"></ElCheckbox>
        <ElCheckbox for="cheminee" label="Cave" v-model="formProperty.cellar"></ElCheckbox>
        <ElCheckbox for="cheminee" label="Local vélo" v-model="formProperty.bike_room"></ElCheckbox>
        <ElCheckbox for="cheminee" label="guardian" v-model="formProperty.guardian"></ElCheckbox>

        <SbTypography>Type de toit</SbTypography>

        <el-radio-group v-model="formProperty.roof" size="large" required>
          <el-radio-button label="Tuile" value="tuile" />
          <el-radio-button label="Ardoise" value="ardoise" />
          <el-radio-button label="Plat" value="plat" />
        </el-radio-group>

        <ElCheckbox label="Mitoyenneté" v-model="formProperty.adjoining"></ElCheckbox>
        <ElCheckbox label="Sous sol" v-model="formProperty.basement"></ElCheckbox>     
        <ElCheckbox label="Dependance" v-model="formProperty.dependency"></ElCheckbox>
        <ElCheckbox label="Autonomie de plein pied" v-model="formProperty.ground"></ElCheckbox>         
        <SbTypography as="label">Commentaire</SbTypography>
        <SbInput size="small" v-model="formProperty.comment" autosize type="textarea"></SbInput>

      </el-form>

  <!-- Footer du Dialog -->
  <template #footer>
    <div class="dialog-footer">
      <el-button @click="dialogPropertyVisible = false">Annuler</el-button>
      <el-button type="primary" @click="formProperty.id ? savePropertyButton() : createPropertyButton(); /*dialogFormAddressVisible = false;*/">
        {{ formProperty.id ? 'Sauvegarder' : 'Créer' }}
      </el-button>
    </div>
  </template>
</el-dialog>

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
import { ElCheckbox } from "element-plus";

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

const  localAddress = ref<string>('');






const roomType = [
  // {
  //   type: 'room',
  //   title: 'Pièces de vie',
  //   value: 'rooms',
  //   number: props.localAddress.rooms
  // },
  {
    type: 'bedroom',
    title: 'Chambres',
    value: 'bedrooms',
    //number: localAddress.bedrooms
  },
  {
    type: 'bathroom',
    title: 'Salles de bains',
    value: 'bathrooms',
    //number: localAddress.bathrooms
  }
]


const increase = (type: string, event?: Event) => {
  if (event) {
    event.preventDefault();
  }
  if (type === 'rooms') {
    props.localAddress.rooms++
  } else if (type === 'bedrooms') {
    props.localAddress.bedrooms++
  } else if (type === 'bathrooms') {
    props.localAddress.bathrooms++
  }
}

const decrease = (type: string, event?: Event) => {
  if (event) {
    event.preventDefault();
  }
  if (type === 'rooms') {
    if (props.localAddress.rooms > 0) {
      props.localAddress.rooms--
    }
  } else if (type === 'bedrooms') {
    if (props.localAddress.bedrooms > 0) {
      props.localAddress.bedrooms--
    }
  } else if (type === 'bathrooms') {
    if (props.localAddress.bathrooms > 0) {
      props.localAddress.bathrooms--
    }
  }
}

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



const sortByNumero = (a, b) => {
  // On compare les champs 'numero' en tant qu'entiers
  return parseInt(a.numero, 10) - parseInt(b.numero, 10);
};
 

const sortByNumeroAndAppartement = (a, b) => {
  const numeroA = parseInt(a.numero) || 0;
  const numeroB = parseInt(b.numero) || 0;

  // Premier tri sur la colonne 'numero'
  if (numeroA !== numeroB) {
    return numeroA - numeroB;
  }

  // Si les numéros de rue sont égaux, on trie par 'numero_appartement'
  const appartementA = parseInt(a.numero_appartement) || 0;
  const appartementB = parseInt(b.numero_appartement) || 0;

  return appartementA - appartementB;
};

//CODE POUR AFFICHER LA FICHE PROPERTY

const formAddress = ref({})

const property_idFantoirLong = ref('');

//AFFICHE/MASQUE LA FENETRE DE DIALOG
const dialogPropertyVisible = ref(false);

const toggleDialogVisibility = (selectedAddress) => 
{
  formAddress.value = { ...selectedAddress };
  dialogPropertyVisible.value = !dialogPropertyVisible.value;

  property_idFantoirLong.value = formAddress.value.id_fantoir + 
  (formAddress.value.numero ? "_" + formAddress.value.numero : "") + 
  (formAddress.value.rep ? "_" + formAddress.value.rep : "") +
  (formAddress.value.numero_appartement ? "_" + formAddress.value.numero_appartement : "");


  getPropertyData();
}


const formProperty = ref({});
/*const formProperty = ref({
  id: null,
  id_fantoir_long: null,
  id_fantoir: null,
  code_insee: null,
  code_postal: null,
  nom_voie: null,
  numero: null,
  rep: null,
  city: null,
  apart_number: null,
  property_type: "",
  surface: null,
  area: null,
  floor_number: null,
  total_floors: null,
  year_built: null,
  year_buy: null,
  property_condition: null,
  orientation: null,
  rooms: null,
  bedrooms: null,
  bathrooms: null,
  fitted_kitchen: 0,
  equipped_kitchen: 0,
  american_kitchen: 0,
  scullery: 0,
  heating_type: null,
  window: null,
  window_type: null,
  shutter: null,
  cheminee: 0,
  district_heating: 0,
  patio: 0,
  garage: 0,
  pool: 0,
  veranda: 0,
  garden: 0,
  parking: 0,
  basement: 0,
  dependency: 0,
  carport: 0,
  kitchen_ext: 0,
  property_tax: null,
  roof: null,
  adjoining: null,
  sanitation: null,
  ground: null,
  charge: null,
  elevator: 0,
  balcony: 0,
  cellar: 0,
  bike_room: 0,
  guardian: 0,
  email: "",
  phone: null,
  owner: "",
  price: null,
  comment: null,
});*/

//Chargement des informations de l'adresse
const getPropertyData = async () => {
try {
  const response = await axios.get(`${API_URL}/property/${property_idFantoirLong.value}`);
  const data = response.data;

  formProperty.value = data;

  //formProperty.value.id_fantoir_long = property_idFantoirLong.value;

  //formProperty.id_fantoir_long.value = property_idFantoirLong.value;

  variableDebug.value = formProperty.value.id;

  
 
} catch (error) {
  console.error('Erreur lors du chargement des données:', error);
  //problem();  

  variableDebug.value = error;
}
};

const createPropertyData = async () => {
  try   {
    const url = `${API_URL}/property`;
    const data = formProperty.value;
    const response = await axios.post(url, data);
    formProperty.value = response.data.property;
  } catch (error) {
    console.error('Erreur lors de la création des données de propriété:', error);   
    variableDebug.value = error;
  }
};

const savePropertyData = async () => {
  try {
    const url = `${API_URL}/property/${encodeURIComponent(formProperty.value.id_fantoir_long)}`;
    const data = formProperty.value;
    const response = await axios.post(url, data);
    formProperty.value = response.data.property;       
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données de propriété:', error);
    variableDebug.value = error;
  }
};

const createPropertyButton = () => {

  //dialogPropertyVisible.value = false;

  createPropertyData();


};

const savePropertyButton = () => {

 /* formTest.value = form2.value;
//permet de mettre à jour le tableau avec les modifications du contact
const index = contact.value.findIndex(c => c.id === form2.value.id);
if (index !== -1) {
  contact.value[index] = { ...form2.value };
}
form2.value = {};*/



dialogPropertyVisible.value = false;

//API SAVE CONTACT
savePropertyData();


}





/*const saveAddress = () => {



formTest.value = form2.value;

//permet de mettre à jour le tableau avec les modifications du contact
const index = contact.value.findIndex(c => c.id === form2.value.id);
if (index !== -1) {
  contact.value[index] = { ...form2.value };
}

form2.value = {};
dialogFormVisible.value = false;


//API SAVE CONTACT
saveAddressData();
}*/


//Sauvegarde du contact
/*const saveAddressData = async () => {
try {
  const url = `https://mytms.fr/public/api/contact/${encodeURIComponent(formTest.value.id)}`;
  const response = await axios.put(url, formTest.value);
  //saveOk();

  variableDebug.value = response;
 
} catch (error) {
  console.error('Erreur lors de la sauvegarde des données:', error);
  //problem();  

  variableDebug.value = error;
}
};*/



//Chargement des infos de l'adresse
/*const getAddressData = async () => {
try {
  const url = `https://mytms.fr/public/api/contact/${encodeURIComponent(formTest.value.id)}`;
  const response = await axios.put(url, formTest.value);
  //saveOk();

  variableDebug.value = response;
 
} catch (error) {
  console.error('Erreur lors de la sauvegarde des données:', error);
  //problem();  

  variableDebug.value = error;
}
};*/

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
