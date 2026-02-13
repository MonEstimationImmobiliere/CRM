<template>
  <el-drawer
    v-model="visible"
    size="40%"
    :style="{
      borderRadius: '10px',
      height: '98%',
      bottom: 0,
      top: 'unset',
      '--el-drawer-padding-primary': '0',
    }"
  >
    <template #header="{ titleId }">
      <div class="headerContainer">
        <div></div>
        <h4 :id="titleId" class="titleHeader">{{ dialogTitle }}</h4>
        <div class="header-actions">
          <el-button
            @click="toggleFavorite"
            :type="
              store.selectedProperty?.id_fantoir_long &&
              store.isFavorite(store.selectedProperty.id_fantoir_long)
                ? 'warning'
                : 'default'
            "
            size="small"
            circle
          >
            <el-icon>
              <StarFilled
                v-if="
                  store.selectedProperty?.id_fantoir_long &&
                  store.isFavorite(store.selectedProperty.id_fantoir_long)
                "
              />

              <Star v-else />
            </el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <el-form
      v-if="store.selectedProperty"
      :model="store.selectedProperty"
      label-width="180px"
      class="property-form"
    >
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
                <el-input
                  v-model="store.selectedProperty.email"
                  size="large"
                  :formatter="emailFormatter"
                  :parser="emailParser"
                />
              </el-form-item>

              <el-form-item label="Téléphone">
                <el-input
                  v-model="store.selectedProperty.phone"
                  size="large"
                  :formatter="phoneFormatter"
                  :parser="phoneParser"
                />
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
                <el-radio-group
                  v-model="store.selectedProperty.property_type"
                  size="large"
                >
                  <el-radio-button label="Maison">Maison</el-radio-button>
                  <el-radio-button label="Appartement"
                    >Appartement</el-radio-button
                  >
                </el-radio-group>
              </el-form-item>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <el-form-item label="Année de construction">
                  <el-input-number
                    v-model="store.selectedProperty.year_built"
                    :min="1800"
                    :max="new Date().getFullYear()"
                    size="large"
                    class="w-full"
                  />
                </el-form-item>

                <el-form-item label="Année d'acquisition">
                  <el-input-number
                    v-model="store.selectedProperty.year_buy"
                    :min="1800"
                    :max="new Date().getFullYear()"
                    size="large"
                    class="w-full"
                  />
                </el-form-item>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <el-form-item label="Surface habitable">
                  <el-input-number
                    v-model="store.selectedProperty.surface"
                    :min="0"
                    :precision="2"
                    :step="1"
                    size="large"
                    class="w-full"
                  >
                    <template #suffix>m²</template>
                  </el-input-number>
                </el-form-item>

                <el-form-item label="Surface du terrain">
                  <el-input-number
                    v-model="store.selectedProperty.area"
                    :min="0"
                    :precision="2"
                    :step="1"
                    size="large"
                    class="w-full"
                  >
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
                <el-radio-group
                  v-model="store.selectedProperty.orientation"
                  size="large"
                >
                  <el-radio-button label="Nord">Nord</el-radio-button>
                  <el-radio-button label="Sud">Sud</el-radio-button>
                  <el-radio-button label="Est">Est</el-radio-button>
                  <el-radio-button label="Ouest">Ouest</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="État général">
                <el-radio-group
                  v-model="store.selectedProperty.property_condition"
                  size="large"
                >
                  <el-radio-button label="Travaux à réaliser"
                    >Travaux à réaliser</el-radio-button
                  >
                  <el-radio-button label="Rafraichissement"
                    >Rafraichissement</el-radio-button
                  >
                  <el-radio-button label="Pas de travaux"
                    >Pas de travaux</el-radio-button
                  >
                </el-radio-group>
              </el-form-item>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <el-form-item label="Chambres">
                  <el-input-number
                    v-model="store.selectedProperty.bedrooms"
                    :min="0"
                    size="large"
                    class="w-full"
                  />
                </el-form-item>

                <el-form-item label="Salles de bains">
                  <el-input-number
                    v-model="store.selectedProperty.bathrooms"
                    :min="0"
                    size="large"
                    class="w-full"
                  />
                </el-form-item>
              </div>
            </div>
          </el-card>

          <!-- Kitchen Features Card -->
          <el-card shadow="hover">
            <h3 class="card-title">Cuisine</h3>
            <div class="card-content-grid">
              <el-checkbox
                v-model="store.selectedProperty.fitted_kitchen"
                label="Cuisine aménagée"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.equipped_kitchen"
                label="Cuisine équipée"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.american_kitchen"
                label="Cuisine américaine"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.scullery"
                label="Arrière-cuisine"
                size="large"
              />
            </div>
          </el-card>

          <!-- Heating and Windows Card -->
          <el-card shadow="hover">
            <h3 class="card-title">Chauffage et Fenêtres</h3>
            <div class="card-content">
              <el-form-item label="Type de chauffage">
                <el-select
                  v-model="store.selectedProperty.heating_type"
                  size="large"
                  class="w-full"
                >
                  <el-option value="fuel" label="Fuel" />
                  <el-option value="elec" label="Électricité (radiateur)" />
                  <el-option value="pompe_a_chaleur" label="Pompe à chaleur" />
                  <el-option value="gaz" label="Gaz" />
                  <el-option value="cheminee" label="Cheminée" />
                  <el-option value="poele" label="Poêle" />
                </el-select>
              </el-form-item>

              <el-form-item label="Type de fenêtres">
                <el-radio-group
                  v-model="store.selectedProperty.window"
                  size="large"
                >
                  <el-radio-button label="Simple"
                    >Simple vitrage</el-radio-button
                  >
                  <el-radio-button label="Double"
                    >Double vitrage</el-radio-button
                  >
                  <el-radio-button label="Triple"
                    >Triple vitrage</el-radio-button
                  >
                </el-radio-group>
              </el-form-item>

              <el-form-item label="Matériau fenêtres">
                <el-radio-group
                  v-model="store.selectedProperty.window_type"
                  size="large"
                >
                  <el-radio-button label="PVC">PVC</el-radio-button>
                  <el-radio-button label="Bois">Bois</el-radio-button>
                  <el-radio-button label="Aluminium">Aluminium</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="Type de volets">
                <el-radio-group
                  v-model="store.selectedProperty.shutter"
                  size="large"
                >
                  <el-radio-button label="roulant_elec"
                    >Électrique</el-radio-button
                  >
                  <el-radio-button label="roulant_manuel"
                    >Manuel</el-radio-button
                  >
                  <el-radio-button label="battant">À battant</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </div>
          </el-card>

          <!-- Amenities Card -->
          <el-card shadow="hover">
            <h3 class="card-title">Équipements et Commodités</h3>
            <div class="card-content-grid">
              <el-checkbox
                v-model="store.selectedProperty.cheminee"
                label="Cheminée d'appoint"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.district_heating"
                label="Chauffage collectif"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.patio"
                label="Terrasse"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.garage"
                label="Garage"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.pool"
                label="Piscine"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.veranda"
                label="Véranda"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.garden"
                label="Jardin"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.parking"
                label="Parking privé"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.carport"
                label="Carport"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.kitchen_ext"
                label="Cuisine extérieure"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.elevator"
                label="Ascenseur"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.balcony"
                label="Balcon"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.cellar"
                label="Cave"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.bike_room"
                label="Local vélo"
                size="large"
              />
              <el-checkbox
                v-model="store.selectedProperty.guardian"
                label="Gardien"
                size="large"
              />
            </div>
          </el-card>

          <!-- Roof and Structure Card -->
          <el-card shadow="hover">
            <h3 class="card-title">Toiture et Structure</h3>
            <div class="card-content">
              <el-form-item label="Type de toit">
                <el-radio-group
                  v-model="store.selectedProperty.roof"
                  size="large"
                >
                  <el-radio-button label="tuile">Tuile</el-radio-button>
                  <el-radio-button label="ardoise">Ardoise</el-radio-button>
                  <el-radio-button label="plat">Toit plat</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <div class="checkbox-container">
                <el-checkbox
                  v-model="store.selectedProperty.adjoining"
                  label="Mitoyenneté"
                  size="large"
                />
                <el-checkbox
                  v-model="store.selectedProperty.basement"
                  label="Sous-sol"
                  size="large"
                />
                <el-checkbox
                  v-model="store.selectedProperty.dependency"
                  label="Dépendance"
                  size="large"
                />
                <el-checkbox
                  v-model="store.selectedProperty.ground"
                  label="Plain-pied"
                  size="large"
                />
              </div>
            </div>
          </el-card>

          <!-- Comments Card -->
          <el-card shadow="hover">
            <h3 class="card-title">Commentaires</h3>
            <div class="card-content">
              <el-input
                v-model="store.selectedProperty.comment"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 6 }"
                placeholder="Ajoutez vos commentaires ici..."
              />
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
                  style="width: 100%"
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
                style="font-size: 16px; line-height: 1.6"
                show-word-limit
                maxlength="2000"
              />
              <div
                class="comment-help"
                style="
                  margin-top: 16px;
                  padding: 12px;
                  background-color: #f8fafc;
                  border-radius: 6px;
                  font-size: 14px;
                  color: #6b7280;
                "
              >
                💡 <strong>Conseil :</strong> Utilisez cette section pour noter
                des informations importantes comme l'état du bien, les travaux à
                prévoir, les négociations en cours, ou tout autre détail utile.
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- Tab Rappels -->
        <el-tab-pane label="Rappels" name="reminders">
          <PropertyReminderList
           l-tab-pane>
      </el-tabs>

      <div class="dialog-footer">
        <el-button @click="closeDialog" size="large">Annuler</el-button>

        <!-- Bouton pour créer un rappel -->
        <el-button type="success" size="large" @click="openReminderDialog">
          Créer un rappel
        </el-button>

        <el-button type="primary" @click="saveProperty" size="large">
          {{ isEditing ? 'Sauvegarder' : 'Créer' }}
        </el-button>
      </div>
    </el-form>
  </el-drawer>

  <!-- Dialog pour créer un rappel -->
  <PropertyReminderForm
    v-model="showReminderDialog"
    :property-id="store.selectedProperty?.id ?? 0"
    :property-address="propertyAddress"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ElForm,
  ElIcon,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElRadioGroup,
  ElRadioButton,
  ElCheckbox,
  ElButton,
  ElSelect,
  ElOption,
  ElCard,
  ElDrawer,
  ElMessage,
  ElTabs,
  ElTabPane,
} from 'element-plus';
import { Star, StarFilled } from '@element-plus/icons-vue';
import { usePropertyStore } from '../../stores/propertyHome';
import { useDashboardStore } from '../../stores/dashboard';
import PropertyReminderForm from './PropertyReminderForm.vue';
import PropertyReminderList from './PropertyReminderList.vue';

const store = usePropertyStore();
const dashboardStore = useDashboardStore();
const { selectedCity } = useDashboardStore();

const visible = computed<boolean>({
  get: () => store.isDialogVisible,
  set: (value: boolean) => store.setDialogVisible(value),
});

const isEditing = computed<boolean>(() => !!store.selectedProperty?.id);

const dialogTitle = computed<string>(() => {
  if (!store.selectedProperty) return 'Nouvelle propriété';

  const codePostal = store.selectedProperty.code_postal || '';
  // Récupérer la ville depuis le store dashboard (input sélectionné) - city contient le nom de la ville
  const city =
    (dashboardStore.selectedCity as any)?.city ||
    store.selectedProperty.city ||
    '';
  const numero = store.selectedProperty.numero || '';
  const rep = store.selectedProperty.rep
    ? ` ${store.selectedProperty.rep}`
    : '';
  const voie = store.selectedProperty.nom_voie || '';

  return `${numero}${rep} ${voie}, ${codePostal} ${city}`;
});

const emailFormatter = (value: string): string => value.toLowerCase();
const emailParser = (value: string): string => value.trim();

const phoneFormatter = (value: string): string =>
  value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ');
const phoneParser = (value: string): string =>
  value.replace(/\D/g, '').substring(0, 10);

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
        filteredProperty.city = selectedCity?.value || '';
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

// État du dialog de rappel
const showReminderDialog = ref(false);

// Variable pour l'onglet actif
const activeTab = ref('contact');

// Adresse formatée pour le composant de rappel
const propertyAddress = computed(() =>
  `${store.selectedProperty?.numero || ''} ${store.selectedProperty?.nom_voie || ''}`.trim()
);

// Ouvrir la modal de création de rappel
const openReminderDialog = () => {
  if (!store.selectedProperty?.id_fantoir_long) return;
  showReminderDialog.value = true;
};

// Gestion des favoris
const toggleFavorite = async () => {
  if (!store.selectedProperty?.id_fantoir_long) return;

  try {
    const newFavoriteState = await store.toggleFavorite(
      store.selectedProperty.id_fantoir_long
    );
    ElMessage({
      message: newFavoriteState
        ? 'Propriété ajoutée aux favoris'
        : 'Propriété retirée des favoris',
      type: newFavoriteState ? 'success' : 'info',
      duration: 2000,
    });
  } catch (error) {
    ElMessage({
      message:
        "La fiche du logement n'est pas encore créée. Veuillez la créer avant de l'ajouter aux favoris.",
      type: 'error',
      duration: 3000,
    });
  }
};
</script>

<style scoped>
.el-drawer.ltr {
  top: none;
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

/* No reminders state — now in PropertyReminderList.vue */

.checkbox-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
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
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
</style>
