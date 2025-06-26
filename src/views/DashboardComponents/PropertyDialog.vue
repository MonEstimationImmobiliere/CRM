<script setup lang="ts">
import { computed, ref } from "vue";
import { ElDialog, ElForm, ElIcon, ElFormItem, ElInput, ElInputNumber, ElRadioGroup, ElRadioButton, ElCheckbox, ElRow, ElCol, ElButton, ElSelect, ElOption, ElCard, ElDrawer, ElDatePicker, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage } from "element-plus";
import { usePropertyStore } from "../../stores/propertyHome";
import { useRemindersStore } from "../../stores/reminders";
import { useDashboardStore } from "../../stores/dashboard";
import { CircleCloseFilled, ArrowDown, Close, Plus, Star, StarFilled } from "@element-plus/icons-vue";

// Property interface
interface Property {
  id?: string | number;
  id_fantoir_long?: string;
  numero?: string;
  rep?: string;
  nom_voie?: string;
  numero_appartement?: string;
  code_postal?: string;
  nom_commune?: string;
  owner?: string;
  email?: string;
  phone?: string;
  property_type?: string;
  year_built?: number;
  year_buy?: number;
  surface?: number;
  area?: number;
  orientation?: string;
  property_condition?: string;
  bedrooms?: number;
  bathrooms?: number;
  fitted_kitchen?: boolean;
  equipped_kitchen?: boolean;
  american_kitchen?: boolean;
  scullery?: boolean;
  heating_type?: string;
  window?: string;
  window_type?: string;
  shutter?: string;
  cheminee?: boolean;
  district_heating?: boolean;
  patio?: boolean;
  Garage?: boolean;
  pool?: boolean;
  veranda?: boolean;
  garden?: boolean;
  parking?: boolean;
  Carport?: boolean;
  kitchen_ext?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  cellar?: boolean;
  bike_room?: boolean;
  guardian?: boolean;
  roof?: string;
  adjoining?: boolean;
  basement?: boolean;
  dependency?: boolean;
  ground?: boolean;
  comment?: string;
  date_rappel?: string;
  comment_rappel?: string;
  price?: number;
}

const store = usePropertyStore();
const remindersStore = useRemindersStore();
const dashboardStore = useDashboardStore();

const visible = computed<boolean>({
  get: () => store.isDialogVisible,
  set: (value: boolean) => store.setDialogVisible(value),
});

const isEditing = computed<boolean>(() => !!store.selectedProperty?.id);

const dialogTitle = computed<string>(() => {
  if (!store.selectedProperty) return "Nouvelle propriété";
  
  const numero = store.selectedProperty.numero || "";
  const rep = store.selectedProperty.rep ? ` ${store.selectedProperty.rep}` : "";
  const voie = store.selectedProperty.nom_voie || "";
  const appart = store.selectedProperty.numero_appartement
    ? ` - Appartement ${store.selectedProperty.numero_appartement}`
    : "";

  return `${numero}${rep} - ${voie}${appart}`;
});

const emailFormatter = (value: string): string => value.toLowerCase();
const emailParser = (value: string): string => value.trim();

const phoneFormatter = (value: string): string => value.replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1 ");
const phoneParser = (value: string): string => value.replace(/\D/g, "").substring(0, 10);

const closeDialog = (): void => {
  store.setDialogVisible(false);
  store.selectProperty(null);
};

const saveProperty = async (): Promise<void> => {
  if (store.selectedProperty) {
    const filteredProperty = store.selectedProperty as any;
    delete filteredProperty.comment_rappel; 
    try {
      if (isEditing.value) {
        await store.saveProperty(filteredProperty);
      } else {
        await store.saveProperty(filteredProperty);
      }
      
      // Refresh the dashboard data after successful save
      if (dashboardStore.selectedCodeIdFantoir && dashboardStore.isDataLoaded) {
        await dashboardStore.querySearchAddress();
      }
      
      closeDialog();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  }
};

// Fonction pour désactiver les dates antérieures à aujourd'hui
const disabledDate = (time: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
};

// Computed pour gérer la date de rappel avec conversion de type
const reminderDate = computed({
  get: () => store.selectedProperty?.date_rappel || '',
  set: (value: string) => {
    if (store.selectedProperty) {
      store.selectedProperty.date_rappel = value;
    }
  }
});

// Variables pour la gestion des rappels multiples
const showReminderDialog = ref(false);
const reminderDialogMode = ref('');
const multipleReminders = ref<Array<{
  title: string;
  description: string;
  date: string;
  type: 'rappel' | 'estimation' | 'visite' | 'autre';
  priority: 'low' | 'medium' | 'high';
  sharing: boolean;
}>>([
  { title: '', description: '', date: '', type: 'rappel', priority: 'medium', sharing: false }
]);

// Méthode pour gérer les commandes du dropdown de rappels
const handleReminderCommand = (command: string) => {
  reminderDialogMode.value = command;
  
  if (command === 'single') {
    createSingleReminder();
  } else if (command === 'multiple') {
    showReminderDialog.value = true;
    initializeMultipleReminders();
  } else if (command === 'recurring') {
    showReminderDialog.value = true;
    // TODO: Implement recurring reminders
  }
};

// Créer un rappel simple
const createSingleReminder = () => {
  if (!store.selectedProperty?.id_fantoir_long) return;
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const propertyAddress = `${store.selectedProperty?.numero || ''} ${store.selectedProperty?.nom_voie || ''}`.trim();
  const propertyCity = store.selectedProperty?.nom_commune || '';
  
  remindersStore.addReminder({
    title: `Rappel - ${propertyAddress || 'Propriété'}`,
    description: 'Rappel simple pour cette propriété',
    date: tomorrow.toISOString().split('T')[0],
    type: 'rappel',
    priority: 'medium',
    sharing: false,
    property_id: store.selectedProperty.id_fantoir_long,
    completed: false,
  });
  
  // Notification de succès
  ElMessage({
    message: 'Rappel simple créé avec succès !',
    type: 'success',
    duration: 3000,
  });
};

// Initialiser les rappels multiples
const initializeMultipleReminders = () => {
  multipleReminders.value = [
    { title: '', description: '', date: '', type: 'rappel', priority: 'medium', sharing: false },
    { title: '', description: '', date: '', type: 'estimation', priority: 'medium', sharing: false },
    { title: '', description: '', date: '', type: 'visite', priority: 'medium', sharing: false }
  ];
};

// Ajouter un nouveau rappel à la liste
const addReminderToList = () => {
  multipleReminders.value.push({
    title: '',
    description: '',
    date: '',
    type: 'rappel',
    priority: 'medium',
    sharing: false
  });
};

// Supprimer un rappel de la liste
const removeReminderFromList = (index: number) => {
  if (multipleReminders.value.length > 1) {
    multipleReminders.value.splice(index, 1);
  }
};

// Sauvegarder les rappels multiples
const saveMultipleReminders = () => {
  if (!store.selectedProperty?.id_fantoir_long) return;
  
  const propertyAddress = `${store.selectedProperty?.numero || ''} ${store.selectedProperty?.nom_voie || ''}`.trim();
  const propertyCity = store.selectedProperty?.nom_commune || '';
  
  let validReminders = 0;
  
  multipleReminders.value.forEach((reminder, index) => {
    if (reminder.title && reminder.date) {
      remindersStore.addReminder({
        title: reminder.title || `Rappel ${index + 1} - ${propertyAddress}`,
        description: reminder.description || `Rappel ${index + 1} pour cette propriété`,
        date: reminder.date,
        type: reminder.type,
        priority: reminder.priority,
        sharing: reminder.sharing,
        property_id: store.selectedProperty!.id_fantoir_long,
        completed: false,
      });
      validReminders++;
    }
  });
  
  if (validReminders > 0) {
    ElMessage({
      message: `${validReminders} rappel(s) créé(s) avec succès !`,
      type: 'success',
      duration: 3000,
    });
    showReminderDialog.value = false;
  } else {
    ElMessage({
      message: 'Veuillez remplir au moins un titre et une date.',
      type: 'warning',
      duration: 3000,
    });
  }
};

// Gestion des favoris
const toggleFavorite = async () => {
  if (!store.selectedProperty?.id_fantoir_long) return;
  
  try {
    if (store.isFavorite(store.selectedProperty.id_fantoir_long)) {
      await store.removeFromFavorites(store.selectedProperty.id_fantoir_long);
      ElMessage({
        message: 'Propriété retirée des favoris',
        type: 'info',
        duration: 2000,
      });
    } else {
      await store.addToFavorites(store.selectedProperty.id_fantoir_long);
      ElMessage({
        message: 'Propriété ajoutée aux favoris',
        type: 'success',
        duration: 2000,
      });
    }
  } catch (error) {
    ElMessage({
      message: 'Erreur lors de la modification des favoris',
      type: 'error',
      duration: 3000,
    });
  }
};

</script>

<template>
   <el-drawer v-model="visible" size="40%" :style="{ borderRadius: '10px', height: '98%', bottom: 0, top: 'unset',  '--el-drawer-padding-primary': '0'  }">

    <template #header="{ titleId }">
      <div class="headerContainer">
        <div></div>
        <h4 :id="titleId" class="titleHeader">{{ dialogTitle }}</h4>
        <div class="header-actions">
          <el-button 
            @click="toggleFavorite" 
            :type="store.selectedProperty?.id_fantoir_long && store.isFavorite(store.selectedProperty.id_fantoir_long) ? 'warning' : 'default'"
            size="small"
            circle
          >
            <el-icon>
              <StarFilled v-if="store.selectedProperty?.id_fantoir_long && store.isFavorite(store.selectedProperty.id_fantoir_long)" />
              <Star v-else />
            </el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <el-form v-if="store.selectedProperty" :model="store.selectedProperty" label-width="180px" class="property-form" >         

      <!-- Contact Information Card -->
      <el-card shadow="hover">
        <h3 class="card-title">Informations de contact</h3>        
        <div class="card-content">
          <el-form-item label="Propriétaire">
            <el-input v-model="store.selectedProperty.owner" size="large" />
          </el-form-item>

          <el-form-item label="Mail">
            <el-input v-model="store.selectedProperty.email" size="large" :formatter="emailFormatter" :parser="emailParser" />
          </el-form-item>

          <el-form-item label="Téléphone">
            <el-input v-model="store.selectedProperty.phone" size="large" :formatter="phoneFormatter" :parser="phoneParser" />
          </el-form-item>
        </div>
      </el-card>

      <!-- Basic Property Information Card -->
       <el-card shadow="hover">
        <h3 class="card-title">Informations principales</h3>
        <div class="card-content">
          <el-form-item label="Type de bien">
            <el-radio-group v-model="store.selectedProperty.property_type" size="large">
              <el-radio-button label="Maison">Maison</el-radio-button>
              <el-radio-button label="Appartement">Appartement</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <el-form-item label="Année de construction">
              <el-input-number v-model="store.selectedProperty.year_built" :min="1800" :max="new Date().getFullYear()" size="large" class="w-full" />
            </el-form-item>

            <el-form-item label="Année d'acquisition">
              <el-input-number v-model="store.selectedProperty.year_buy" :min="1800" :max="new Date().getFullYear()" size="large" class="w-full" />
            </el-form-item>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <el-form-item label="Surface habitable">
              <el-input-number v-model="store.selectedProperty.surface" :min="0" :precision="2" :step="1" size="large" class="w-full">
                <template #suffix>m²</template>
              </el-input-number>
            </el-form-item>

            <el-form-item label="Surface du terrain">
              <el-input-number v-model="store.selectedProperty.area" :min="0" :precision="2" :step="1" size="large" class="w-full">
                <template #suffix>m²</template>
              </el-input-number>
            </el-form-item>
          </div>
        </div>
      </el-card>

      <!-- Property Details Card -->
       <el-card shadow="hover">
        <h3 class="card-title">Caractéristiques</h3>
        <div class="card-content">
          <el-form-item label="Orientation">
            <el-radio-group v-model="store.selectedProperty.orientation" size="large">
              <el-radio-button label="Nord">Nord</el-radio-button>
              <el-radio-button label="Sud">Sud</el-radio-button>
              <el-radio-button label="Est">Est</el-radio-button>
              <el-radio-button label="Ouest">Ouest</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="État général">
            <el-radio-group v-model="store.selectedProperty.property_condition" size="large">
              <el-radio-button label="Travaux à réaliser">Travaux à réaliser</el-radio-button>
              <el-radio-button label="Rafraichissement">Rafraichissement</el-radio-button>
              <el-radio-button label="Pas de travaux">Pas de travaux</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <el-form-item label="Chambres">
              <el-input-number v-model="store.selectedProperty.bedrooms" :min="0" size="large" class="w-full" />
            </el-form-item>

            <el-form-item label="Salles de bains">
              <el-input-number v-model="store.selectedProperty.bathrooms" :min="0" size="large" class="w-full" />
            </el-form-item>
          </div>
        </div>
      </el-card>

      <!-- Kitchen Features Card -->
       <el-card shadow="hover">
        <h3 class="card-title">Cuisine</h3>
        <div class="card-content-grid">
          <el-checkbox v-model="store.selectedProperty.fitted_kitchen" label="Cuisine aménagée" size="large" />
          <el-checkbox v-model="store.selectedProperty.equipped_kitchen" label="Cuisine équipée" size="large" />
          <el-checkbox v-model="store.selectedProperty.american_kitchen" label="Cuisine américaine" size="large" />
          <el-checkbox v-model="store.selectedProperty.scullery" label="Arrière-cuisine" size="large" />
        </div>
      </el-card>

      <!-- Heating and Windows Card -->
       <el-card shadow="hover">
        <h3 class="card-title">Chauffage et Fenêtres</h3>
        <div class="card-content">
          <el-form-item label="Type de chauffage">
            <el-select v-model="store.selectedProperty.heating_type" size="large" class="w-full">
              <el-option value="fuel" label="Fuel" />
              <el-option value="elec" label="Électricité (radiateur)" />
              <el-option value="pompe_a_chaleur" label="Pompe à chaleur" />
              <el-option value="gaz" label="Gaz" />
              <el-option value="cheminee" label="Cheminée" />
              <el-option value="poele" label="Poêle" />
            </el-select>
          </el-form-item>

          <el-form-item label="Type de fenêtres">
            <el-radio-group v-model="store.selectedProperty.window" size="large">
              <el-radio-button label="Simple">Simple vitrage</el-radio-button>
              <el-radio-button label="Double">Double vitrage</el-radio-button>
              <el-radio-button label="Triple">Triple vitrage</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="Matériau fenêtres">
            <el-radio-group v-model="store.selectedProperty.window_type" size="large">
              <el-radio-button label="PVC">PVC</el-radio-button>
              <el-radio-button label="Bois">Bois</el-radio-button>
              <el-radio-button label="Aluminium">Aluminium</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="Type de volets">
            <el-radio-group v-model="store.selectedProperty.shutter" size="large">
              <el-radio-button label="roulant_elec">Électrique</el-radio-button>
              <el-radio-button label="roulant_manuel">Manuel</el-radio-button>
              <el-radio-button label="battant">À battant</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-card>

      <!-- Amenities Card -->
       <el-card shadow="hover">
        <h3 class="card-title">Équipements et Commodités</h3>
        <div class="card-content-grid">
          <el-checkbox v-model="store.selectedProperty.cheminee" label="Cheminée d'appoint" size="large" />
          <el-checkbox v-model="store.selectedProperty.district_heating" label="Chauffage collectif" size="large" />
          <el-checkbox v-model="store.selectedProperty.patio" label="Terrasse" size="large" />
          <el-checkbox v-model="store.selectedProperty.Garage" label="Garage" size="large" />
          <el-checkbox v-model="store.selectedProperty.pool" label="Piscine" size="large" />
          <el-checkbox v-model="store.selectedProperty.veranda" label="Véranda" size="large" />
          <el-checkbox v-model="store.selectedProperty.garden" label="Jardin" size="large" />
          <el-checkbox v-model="store.selectedProperty.parking" label="Parking privé" size="large" />
          <el-checkbox v-model="store.selectedProperty.Carport" label="Carport" size="large" />
          <el-checkbox v-model="store.selectedProperty.kitchen_ext" label="Cuisine extérieure" size="large" />
          <el-checkbox v-model="store.selectedProperty.elevator" label="Ascenseur" size="large" />
          <el-checkbox v-model="store.selectedProperty.balcony" label="Balcon" size="large" />
          <el-checkbox v-model="store.selectedProperty.cellar" label="Cave" size="large" />
          <el-checkbox v-model="store.selectedProperty.bike_room" label="Local vélo" size="large" />
          <el-checkbox v-model="store.selectedProperty.guardian" label="Gardien" size="large" />
        </div>
      </el-card>

      <!-- Roof and Structure Card -->
       <el-card shadow="hover">
        <h3 class="card-title">Toiture et Structure</h3>
        <div class="card-content">
          <el-form-item label="Type de toit">
            <el-radio-group v-model="store.selectedProperty.roof" size="large">
              <el-radio-button label="tuile">Tuile</el-radio-button>
              <el-radio-button label="ardoise">Ardoise</el-radio-button>
              <el-radio-button label="plat">Toit plat</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div class="grid grid-cols-2 gap-4">
            <el-checkbox v-model="store.selectedProperty.adjoining" label="Mitoyenneté" size="large" />
            <el-checkbox v-model="store.selectedProperty.basement" label="Sous-sol" size="large" />
            <el-checkbox v-model="store.selectedProperty.dependency" label="Dépendance" size="large" />
            <el-checkbox v-model="store.selectedProperty.ground" label="Plain-pied" size="large" />
          </div>
        </div>
      </el-card>

      <!-- Comments Card -->
       <el-card shadow="hover">
        <h3 class="card-title">Commentaires</h3>
        <div class="card-content">
          <el-input v-model="store.selectedProperty.comment" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="Ajoutez vos commentaires ici..." />
        </div>
      </el-card>

      <!-- Date de rappel Card -->
      <el-card shadow="hover">
        <h3 class="card-title">Date de rappel</h3>
        <div class="card-content">
          <el-form-item label="Date de rappel">
            <el-date-picker
              v-model="reminderDate"
              type="date"
              placeholder="Sélectionnez une date de rappel"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              size="large"
              :disabled-date="disabledDate"
              style="width: 100%;"
              clearable
            />
          </el-form-item>
          <el-form-item label="Commentaire rappel">
            <el-input
              v-model="store.selectedProperty.comment_rappel"
              type="textarea"
              placeholder="Ajoutez un commentaire pour ce rappel..."
              :rows="3"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </div>
      </el-card>

      <!-- Price Card -->
      <el-card shadow="hover">
        <h3 class="card-title">Prix estimé</h3>
        <div class="card-content">
          <el-form-item label="Prix estimé (€)">
            <el-input-number
              v-model="store.selectedProperty.price"
              :min="0"
              :step="1000"
              :precision="0"
              placeholder="Prix en euros"
              size="large"
              style="width: 100%;"
              controls-position="right"
            />
          </el-form-item>
        </div>
      </el-card>

      <div class="dialog-footer">
        <el-button @click="closeDialog" size="large">Annuler</el-button>
        
        <!-- Dropdown pour les rappels -->
        <el-dropdown @command="handleReminderCommand" trigger="click">
          <el-button type="success" size="large">
            Créer rappel(s)
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="single">Créer un rappel simple</el-dropdown-item>
              <el-dropdown-item command="multiple">Créer plusieurs rappels</el-dropdown-item>
              <el-dropdown-item command="recurring">Créer un rappel récurrent</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <el-button type="primary" @click="saveProperty" size="large">
          {{ isEditing ? "Sauvegarder" : "Créer" }}
        </el-button>
      </div>
    </el-form>
  </el-drawer>

  <!-- Dialog pour les rappels multiples -->
  <el-dialog 
    v-model="showReminderDialog" 
    title="Créer plusieurs rappels"
    width="70%"
    :close-on-click-modal="false"
  >
    <div class="multiple-reminders-form">
      <div 
        v-for="(reminder, index) in multipleReminders" 
        :key="index"
        class="reminder-item"
      >
        <div class="reminder-header">
          <h4>Rappel {{ index + 1 }}</h4>
          <el-button 
            v-if="multipleReminders.length > 1"
            type="danger" 
            size="small" 
            @click="removeReminderFromList(index)"
            circle
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Titre" required>
              <el-input v-model="reminder.title" placeholder="Titre du rappel" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Date" required>
              <el-date-picker
                v-model="reminder.date"
                type="date"
                placeholder="Sélectionnez une date"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                :disabled-date="disabledDate"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Type">
              <el-select v-model="reminder.type" placeholder="Type de rappel">
                <el-option label="Rappel" value="rappel" />
                <el-option label="Estimation" value="estimation" />
                <el-option label="Visite" value="visite" />
                <el-option label="Autre" value="autre" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Priorité">
              <el-select v-model="reminder.priority" placeholder="Priorité">
                <el-option label="Basse" value="low" />
                <el-option label="Moyenne" value="medium" />
                <el-option label="Haute" value="high" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Description">
          <el-input 
            v-model="reminder.description" 
            type="textarea" 
            placeholder="Description du rappel"
            :rows="2"
          />
        </el-form-item>

        <el-form-item label="Partage">
          <el-checkbox v-model="reminder.sharing" label="Partager avec l'agence" />
        </el-form-item>
      </div>
      
      <div class="add-reminder-section">
        <el-button type="success" @click="addReminderToList" size="large">
          <el-icon><Plus /></el-icon>
          Ajouter un rappel
        </el-button>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="showReminderDialog = false">Annuler</el-button>
      <el-button type="primary" @click="saveMultipleReminders">
        Créer les rappels
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>

.el-drawer.ltr {
top : none;
}

:deep(.el-drawer.ltr) {
  top: unset !important;
}

.property-form {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f6f6f6;
  gap: 20px;
  display: flex;
  flex-direction: column;
}

.form-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
}

.form-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.card-content {
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: start;
  flex-direction: column;
}

.card-content-grid {
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}


:deep(.el-form-item__label) {
  color: #374151;
  font-weight: 500;
}

:deep(.el-input),
:deep(.el-input-number),
:deep(.el-select) {
  width: 100%;
}

:deep(.el-radio-button__inner) {
  padding-left: 1rem;
  padding-right: 1rem;
}

:deep(.el-checkbox__label) {
  color: #374151;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

:deep(.el-radio-button__inner) {
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
}

:deep(.el-checkbox) {
  margin: 0;
}

.bg-red {
  background-color: #f87171;
}

.titleHeader {
  font-size: 24px;
  font-weight: bold;
  color: #121212;
  margin-left: 1rem;
}

.headerContainer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* Styles pour les rappels multiples */
.multiple-reminders-form {
  max-height: 70vh;
  overflow-y: auto;
}

.reminder-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #f9fafb;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.reminder-header h4 {
  margin: 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.add-reminder-section {
  text-align: center;
  margin-top: 20px;
  padding: 20px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background-color: #f9fafb;
}
</style>
