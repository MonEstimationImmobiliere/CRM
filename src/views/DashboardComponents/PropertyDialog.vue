<script setup lang="ts">
import { computed, ref } from "vue";
import { ElDialog, ElForm, ElIcon, ElFormItem, ElInput, ElInputNumber, ElRadioGroup, ElRadioButton, ElCheckbox, ElRow, ElCol, ElButton, ElSelect, ElOption, ElCard, ElDrawer, ElDatePicker, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage, ElTag, ElTabs, ElTabPane } from "element-plus";
import { usePropertyStore } from "../../stores/propertyHome";
import { useRemindersStore } from "../../stores/reminders";
import { useDashboardStore } from "../../stores/dashboard";
import { CircleCloseFilled, Star, StarFilled, Warning, Calendar, Clock, Check } from "@element-plus/icons-vue";

const store = usePropertyStore();
const remindersStore = useRemindersStore();
const dashboardStore = useDashboardStore();
const { selectedCity } = useDashboardStore();

const visible = computed<boolean>({
  get: () => store.isDialogVisible,
  set: (value: boolean) => store.setDialogVisible(value),
});

const isEditing = computed<boolean>(() => !!store.selectedProperty?.id);

const dialogTitle = computed<string>(() => {
  if (!store.selectedProperty) return "Nouvelle propriété";
  
  const id = store.selectedProperty?.id;
  const favorite = store.selectedProperty.favorite || "";
  const idFantoir = store.selectedProperty.id_fantoir || "";
  const idFantoirLong = store.selectedProperty.id_fantoir_long || "";
  const codePostal = store.selectedProperty.code_postal || "";
  const city = store.selectedProperty.city || "";
  const numero = store.selectedProperty.numero || "";
  const rep = store.selectedProperty.rep ? ` ${store.selectedProperty.rep}` : "";
  const voie = store.selectedProperty.nom_voie || "";
  const appart = store.selectedProperty.numero_appartement ? ` - Appartement ${store.selectedProperty.numero_appartement}` : "";

  return `${id}\n${codePostal} ${city}(${idFantoir})\n${numero}${rep} - ${voie}${appart}(${idFantoirLong})\nfavorite : ${favorite}`;
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
    console.log('Saving property:', filteredProperty);
    delete filteredProperty.comment_rappel; 
    try {
      if (isEditing.value) {
        await store.saveProperty(filteredProperty);
      } else {
        filteredProperty.city = selectedCity.city;
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

// Variables pour la gestion du rappel unique
const showReminderDialog = ref(false);
const reminderForm = ref({
  title: '',
  description: '',
  date: '',
  type: 'rappel' as 'rappel' | 'estimation' | 'visite' | 'autre',
  priority: 'medium' as 'low' | 'medium' | 'high',
  sharing: false
});

// Variable pour l'onglet actif
const activeTab = ref('contact');

// Ouvrir la modal de création de rappel
const openReminderDialog = () => {
  if (!store.selectedProperty?.id_fantoir_long) return;
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const propertyAddress = `${store.selectedProperty?.numero || ''} ${store.selectedProperty?.nom_voie || ''}`.trim();
  
  // Pré-remplir le formulaire avec des valeurs par défaut
  reminderForm.value = {
    title: `Rappel - ${propertyAddress || 'Propriété'}`,
    description: '',
    date: tomorrow.toISOString().split('T')[0],
    type: 'rappel',
    priority: 'medium',
    sharing: false
  };
  
  showReminderDialog.value = true;
};

// Réinitialiser le formulaire de rappel
const resetReminderForm = () => {
  reminderForm.value = {
    title: '',
    description: '',
    date: '',
    type: 'rappel',
    priority: 'medium',
    sharing: false
  };
};

// Sauvegarder le rappel
const saveReminder = () => {
  if (!store.selectedProperty?.id_fantoir_long) return;
  
  if (!reminderForm.value.title || !reminderForm.value.date) {
    ElMessage({
      message: 'Veuillez remplir au moins le titre et la date.',
      type: 'warning',
      duration: 3000,
    });
    return;
  }
  
  remindersStore.addReminder({
    title: reminderForm.value.title,
    description: reminderForm.value.description,
    date: reminderForm.value.date,
    type: reminderForm.value.type,
    priority: reminderForm.value.priority,
    sharing: reminderForm.value.sharing,
    property_id: store.selectedProperty.id_fantoir_long,
    completed: false,
  });
  
  ElMessage({
    message: 'Rappel créé avec succès !',
    type: 'success',
    duration: 3000,
  });
  
  showReminderDialog.value = false;
  resetReminderForm();
};

// Sauvegarder le rappel et en créer un autre
const saveReminderAndAddAnother = () => {
  if (!store.selectedProperty?.id_fantoir_long) return;
  
  if (!reminderForm.value.title || !reminderForm.value.date) {
    ElMessage({
      message: 'Veuillez remplir au moins le titre et la date.',
      type: 'warning',
      duration: 3000,
    });
    return;
  }
  
  remindersStore.addReminder({
    title: reminderForm.value.title,
    description: reminderForm.value.description,
    date: reminderForm.value.date,
    type: reminderForm.value.type,
    priority: reminderForm.value.priority,
    sharing: reminderForm.value.sharing,
    property_id: store.selectedProperty.id_fantoir_long,
    completed: false,
  });
  
  ElMessage({
    message: 'Rappel créé avec succès !',
    type: 'success',
    duration: 3000,
  });
  
  // Réinitialiser le formulaire mais garder la modal ouverte
  const propertyAddress = `${store.selectedProperty?.numero || ''} ${store.selectedProperty?.nom_voie || ''}`.trim();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  reminderForm.value = {
    title: `Rappel - ${propertyAddress || 'Propriété'}`,
    description: '',
    date: tomorrow.toISOString().split('T')[0],
    type: 'rappel',
    priority: 'medium',
    sharing: false
  };
};

// Computed properties pour les rappels de la propriété
const propertyReminders = computed(() => {
  const propertyId = store.selectedProperty?.id_fantoir_long || "example_property_id_1";
  return remindersStore.getRemindersByProperty(propertyId);
});

const sortedPropertyReminders = computed(() => {
  return [...propertyReminders.value].sort((a, b) => {
    // Trier par date puis par priorité
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date); // Plus récent en premier
    }
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
});

const overdueCounts = computed(() => {
  return propertyReminders.value.filter(r => 
    remindersStore.isReminderOverdue(r)
  ).length;
});

const todayCounts = computed(() => {
  return propertyReminders.value.filter(r => 
    remindersStore.isReminderToday(r) && !r.completed
  ).length;
});

const pendingCounts = computed(() => {
  return propertyReminders.value.filter(r => 
    !r.completed && !remindersStore.isReminderOverdue(r) && !remindersStore.isReminderToday(r)
  ).length;
});

const completedCounts = computed(() => {
  return propertyReminders.value.filter(r => r.completed).length;
});

// Fonctions utilitaires
const toggleReminderComplete = (reminder: any) => {
  if (reminder.completed) {
    remindersStore.completeReminder(reminder.id);
    ElMessage.success('Rappel marqué comme terminé');
  } else {
    remindersStore.uncompleteReminder(reminder.id);
    ElMessage.info('Rappel marqué comme non terminé');
  }
};

const getPriorityType = (priority: string): 'success' | 'warning' | 'danger' | 'info' => {
  const types = { high: 'danger', medium: 'warning', low: 'info' } as const;
  return types[priority as keyof typeof types] || 'info';
};

const getPriorityLabel = (priority: string) => {
  const labels = { high: 'Haute', medium: 'Moyenne', low: 'Basse' };
  return labels[priority as keyof typeof labels] || priority;
};

const getTypeColor = (type: string): 'success' | 'warning' | 'danger' | 'info' => {
  const colors = { 
    rappel: 'info', 
    estimation: 'success', 
    visite: 'warning', 
    autre: 'info' 
  } as const;
  return colors[type as keyof typeof colors] || 'info';
};

const getTypeLabel = (type: string) => {
  const labels = { 
    rappel: 'Rappel', 
    estimation: 'Estimation', 
    visite: 'Visite', 
    autre: 'Autre' 
  };
  return labels[type as keyof typeof labels] || type;
};

const formatReminderDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Gestion des favoris
const toggleFavorite = async () => {
  
  if (!store.selectedProperty?.id_fantoir_long) {
    console.log('No id_fantoir_long, returning early');
    return;
  }
  
  try {
    const newFavoriteState = await store.toggleFavorite(store.selectedProperty.id_fantoir_long);
    ElMessage({
      message: newFavoriteState 
        ? 'Propriété ajoutée aux favoris' 
        : 'Propriété retirée des favoris',
      type: newFavoriteState ? 'success' : 'info',
      duration: 2000,
    });
  } catch (error) {
    console.log('Error in toggleFavorite:', error);
    ElMessage({
      message: 'La fiche du logement n\'est pas encore créée. Veuillez la créer avant de l\'ajouter aux favoris.',
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
        <h4 :id="titleId" class="titleHeader" >{{ dialogTitle }}</h4>
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
      
      <el-tabs v-model="activeTab" class="property-tabs">
        <!-- Tab Contact -->
        <el-tab-pane label="Contact" name="contact">
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
        </el-tab-pane>

        <!-- Tab Caractéristiques -->
        <el-tab-pane label="Caractéristiques" name="characteristics">
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

          <div class="checkbox-container">
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
        </el-tab-pane>

        <!-- Tab Commentaires -->
        <el-tab-pane label="Commentaires" name="comments">
          <el-card shadow="hover">
            <h3 class="card-title">Commentaires sur la propriété</h3>
            <div class="card-content">
              <el-input 
                v-model="store.selectedProperty.comment" 
                type="textarea" 
                :autosize="{ minRows: 6, maxRows: 12 }" 
                placeholder="Ajoutez vos commentaires, observations, ou notes importantes sur cette propriété..."
                style="font-size: 16px; line-height: 1.6;"
                show-word-limit
                maxlength="2000"
              />
              <div class="comment-help" style="margin-top: 16px; padding: 12px; background-color: #f8fafc; border-radius: 6px; font-size: 14px; color: #6b7280;">
                💡 <strong>Conseil :</strong> Utilisez cette section pour noter des informations importantes comme l'état du bien, les travaux à prévoir, les négociations en cours, ou tout autre détail utile.
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- Tab Rappels -->
        <el-tab-pane label="Rappels" name="reminders">
          <!-- Message quand aucun rappel -->
          <el-card shadow="hover" v-if="propertyReminders.length === 0">
            <div class="no-reminders-content">
              <el-icon class="no-reminders-icon"><Calendar /></el-icon>
              <h3>Aucun rappel pour cette propriété</h3>
              <p>Créez votre premier rappel pour cette propriété en utilisant le bouton "Créer un rappel" ci-dessous.</p>
            </div>
          </el-card>

          <!-- Reminders History Card -->
          <el-card shadow="hover" v-if="propertyReminders.length > 0">
        <h3 class="card-title">
          Historique des rappels
          <el-tag :type="overdueCounts > 0 ? 'danger' : pendingCounts > 0 ? 'warning' : 'success'" size="small">
            {{ propertyReminders.length }} rappel{{ propertyReminders.length > 1 ? 's' : '' }}
          </el-tag>
        </h3>
        <div class="card-content">
          <div class="reminders-summary">
            <div class="summary-stats">
              <div class="stat-item" v-if="overdueCounts > 0">
                <el-icon class="stat-icon overdue"><Warning /></el-icon>
                <span>{{ overdueCounts }} en retard</span>
              </div>
              <div class="stat-item" v-if="todayCounts > 0">
                <el-icon class="stat-icon today"><Calendar /></el-icon>
                <span>{{ todayCounts }} aujourd'hui</span>
              </div>
              <div class="stat-item" v-if="pendingCounts > 0">
                <el-icon class="stat-icon pending"><Clock /></el-icon>
                <span>{{ pendingCounts }} à venir</span>
              </div>
              <div class="stat-item" v-if="completedCounts > 0">
                <el-icon class="stat-icon completed"><Check /></el-icon>
                <span>{{ completedCounts }} terminé{{ completedCounts > 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>
          
          <div class="reminders-list-history">
            <div 
              v-for="reminder in sortedPropertyReminders" 
              :key="reminder.id" 
              class="reminder-item"
              :class="{
                'overdue': remindersStore.isReminderOverdue(reminder) && !reminder.completed,
                'today': remindersStore.isReminderToday(reminder) && !reminder.completed,
                'completed': reminder.completed
              }"
            >
              <div class="reminder-header">
                <div class="reminder-info">
                  <el-checkbox 
                    v-model="reminder.completed" 
                    @change="toggleReminderComplete(reminder)"
                    size="large"
                  />
                  <div class="reminder-details">
                    <h4 class="reminder-title">{{ reminder.title }}</h4>
                    <p class="reminder-description" v-if="reminder.description">
                      {{ reminder.description }}
                    </p>
                  </div>
                </div>
                <div class="reminder-meta">
                  <el-tag 
                    :type="getPriorityType(reminder.priority)" 
                    size="small"
                  >
                    {{ getPriorityLabel(reminder.priority) }}
                  </el-tag>
                </div>
              </div>
              
              <div class="reminder-footer">
                <div class="reminder-date-info">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatReminderDate(reminder.date) }}</span>
                  <el-tag 
                    v-if="remindersStore.isReminderOverdue(reminder) && !reminder.completed" 
                    type="danger" 
                    size="small"
                  >
                    En retard
                  </el-tag>
                  <el-tag 
                    v-else-if="remindersStore.isReminderToday(reminder) && !reminder.completed" 
                    type="warning" 
                    size="small"
                  >
                    Aujourd'hui
                  </el-tag>
                </div>
                
                <div class="reminder-actions">
                  <el-tag :type="getTypeColor(reminder.type)" size="small">
                    {{ getTypeLabel(reminder.type) }}
                  </el-tag>
                  <el-tag v-if="reminder.sharing" type="success" size="small">
                    Partagé
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
        </el-card>
        </el-tab-pane>
      </el-tabs>

      <div class="dialog-footer">
        <el-button @click="closeDialog" size="large">Annuler</el-button>
        
        <!-- Bouton pour créer un rappel -->
        <el-button type="success" size="large" @click="openReminderDialog">
          Créer un rappel
        </el-button>
        
        <el-button type="primary" @click="saveProperty" size="large">
          {{ isEditing ? "Sauvegarder" : "Créer" }}
        </el-button>
      </div>
    </el-form>
  </el-drawer>

  <!-- Dialog pour créer un rappel -->
  <el-dialog 
    v-model="showReminderDialog" 
    title="Créer un rappel"
    width="600px"
    :close-on-click-modal="false"
    @close="resetReminderForm"
  >
    <el-form :model="reminderForm" label-width="120px">
      <el-form-item label="Titre" required>
        <el-input v-model="reminderForm.title" placeholder="Titre du rappel" />
      </el-form-item>
      
      <el-form-item label="Description">
        <el-input 
          v-model="reminderForm.description" 
          type="textarea" 
          :rows="3"
          placeholder="Description du rappel"
        />
      </el-form-item>
      
      <el-form-item label="Date" required>
        <el-date-picker 
          v-model="reminderForm.date"
          type="date"
          placeholder="Sélectionnez une date"
          style="width: 100%;"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
        />
      </el-form-item>
      
      <el-form-item label="Type">
        <el-select v-model="reminderForm.type" style="width: 100%;">
          <el-option label="Rappel" value="rappel" />
          <el-option label="Estimation" value="estimation" />
          <el-option label="Visite" value="visite" />
          <el-option label="Autre" value="autre" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="Priorité">
        <el-select v-model="reminderForm.priority" style="width: 100%;">
          <el-option label="Haute" value="high" />
          <el-option label="Moyenne" value="medium" />
          <el-option label="Basse" value="low" />
        </el-select>
      </el-form-item>

      <el-form-item label="Partage">
        <el-checkbox v-model="reminderForm.sharing" label="Partager avec l'agence" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="showReminderDialog = false">Annuler</el-button>
      <el-button type="primary" @click="saveReminder">
        Créer le rappel
      </el-button>
    </template>
    
    <div class="reminder-actions-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
        Vous souhaitez ajouter un autre rappel sur ce bien ?
      </p>
      <el-button 
        type="success" 
        size="small" 
        @click="saveReminderAndAddAnother"
        style="margin-right: 10px;"
      >
        Créer et ajouter un autre
      </el-button>
    </div>
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

.property-tabs {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__header) {
  margin: 0;
  padding: 0 20px;
  background-color: #fafafa;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0;
}

:deep(.el-tabs__content) {
  padding: 20px;
}

:deep(.el-tab-pane) {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

:deep(.el-tabs__item) {
  font-weight: 500;
  font-size: 16px;
  padding: 0 24px;
  height: 50px;
  line-height: 50px;
  color: #6b7280;
}

:deep(.el-tabs__item.is-active) {
  color: #3b82f6;
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  background-color: #3b82f6;
  height: 3px;
}

/* No reminders state */
.no-reminders-content {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.no-reminders-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.checkbox-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.no-reminders-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.no-reminders-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
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
   text-align: center;
  white-space: pre-line;
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

/* Styles pour la modal de rappel */
.reminder-actions-section {
  text-align: center;
  margin-top: 20px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  border-radius: 0 0 8px 8px;
}

/* Styles pour l'historique des rappels */
.reminders-summary {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  font-weight: 500;
}

.stat-icon {
  font-size: 16px;
}

.stat-icon.overdue {
  color: #ef4444;
}

.stat-icon.today {
  color: #f59e0b;
}

.stat-icon.pending {
  color: #3b82f6;
}

.stat-icon.completed {
  color: #10b981;
}

.reminders-list-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.reminder-item {
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease, opacity 0.5s ease, filter 0.5s ease;
}

.reminder-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.reminder-item.overdue {
  border-left: 4px solid #ef4444;
  background-color: #fef2f2;
}

.reminder-item.today {
  border-left: 4px solid #f59e0b;
  background-color: #fffbeb;
}

.reminder-item.completed {
  opacity: 0.6;
  border-left: 4px solid #10b981;
  background-color: #f9fafb;
  filter: grayscale(0.3);
}

.reminder-item.completed .reminder-title {
  text-decoration: line-through;
  color: #9ca3af;
}

.reminder-item.completed .reminder-description {
  color: #9ca3af;
  text-decoration: line-through;
}

.reminder-item.completed .reminder-date-info {
  color: #9ca3af;
}

.reminder-item.completed .reminder-date-info span {
  text-decoration: line-through;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.reminder-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.reminder-details {
  flex: 1;
}

.reminder-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  transition: color 0.3s ease, text-decoration 0.3s ease;
}

.reminder-description {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  transition: color 0.3s ease, text-decoration 0.3s ease;
}

.reminder-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reminder-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.reminder-date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  transition: color 0.3s ease;
}

.reminder-date-info span {
  transition: text-decoration 0.3s ease;
}

.reminder-date-info .el-icon {
  font-size: 16px;
}

.reminder-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
