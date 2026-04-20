<template>
  <Teleport to="body">
    <el-drawer
      v-model="visible"
      size="40%"
      :show-close="false"
      modal-class="darker-drawer-overlay"
      :style="{
        borderRadius: '10px',
        height: '98%',
        bottom: 0,
        backgroundColor: 'var(--ion-background-color)',
        top: 'unset',
        '--el-drawer-padding-primary': '0',
      }"
    >
      <template #header="{ titleId }">
        <div class="header-container">
          <button
            type="button"
            class="el-button el-button--default app-button empty-default-slot icon-only squared border"
            @click="closeDialog"
          >
            <!----><!----><span
              ><div
                data-v-3a4a5748=""
                class="icon-wrapper"
                style="width: 16px; height: 16px"
              >
                <svg
                  data-v-bc71ed1a=""
                  data-v-3a4a5748=""
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  data-path="Bold.InterfaceEssential.FormValidation.Close"
                  class="icon icon start fill"
                  style="--icon-size: 16px"
                >
                  <path
                    d="M14.3 12.18a.24.24 0 0 1 0-.35l9.26-9.27a1.49 1.49 0 0 0 0-2.12 1.51 1.51 0 0 0-2.12 0L12.18 9.7a.25.25 0 0 1-.36 0L2.56.44a1.51 1.51 0 0 0-2.12 0 1.49 1.49 0 0 0 0 2.12l9.26 9.27a.24.24 0 0 1 0 .35L.44 21.44a1.49 1.49 0 0 0 0 2.12 1.51 1.51 0 0 0 2.12 0l9.26-9.26a.25.25 0 0 1 .36 0l9.26 9.26a1.51 1.51 0 0 0 2.12 0 1.49 1.49 0 0 0 0-2.12Z"
                  ></path>
                </svg>
              </div>
              <!----><!----><!----></span
            >
          </button>
          <div></div>
          <h4 :id="titleId" class="title-header">{{ dialogTitle }}</h4>
          <div class="header-actions">
            <el-button @click="toggleFavorite" size="small" circle>
              <el-icon>
                <StarFilled
                  v-if="
                    Number(store.selectedProperty?.favorite) === 1 ||
                    store.selectedProperty?.favorite === true
                  "
                  style="color: #f56c6c"
                />
                <Star v-else style="color: #909399" />
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
        @submit.prevent
      >
        <el-tabs v-model="activeTab" class="property-tabs">
          <el-tab-pane label="Caractéristiques" name="characteristics">
            <CharacteristicsTab
              :property-type="propertyType"
              @open-unit-dialog="openUnitDialog"
            />
          </el-tab-pane>
          <el-tab-pane
            label="Contact"
            name="contact"
            :disabled="isTypeUndefined"
          >
            <ContactTab />
          </el-tab-pane>

          <el-tab-pane
            label="Commentaires"
            name="comments"
            :disabled="isTypeUndefined"
          >
            <CommentsTab />
          </el-tab-pane>

          <el-tab-pane
            label="Rappels"
            name="reminders"
            :disabled="isTypeUndefined"
          >
            <RemindersTab @open-reminder-dialog="openReminderDialog" />
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </el-drawer>

    <PropertyReminderForm
      v-model="showReminderDialog"
      :property-id="store.selectedProperty?.id ?? 0"
      :property-address="propertyAddress"
    />

    <UnitDialog v-model="showUnitDialog" @save="createUnit" />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import {
  ElForm,
  ElIcon,
  ElButton,
  ElDrawer,
  ElMessage,
  ElTabs,
  ElTabPane,
} from 'element-plus';
import { Star, StarFilled } from '@element-plus/icons-vue';
import { usePropertyStore } from '@/stores/propertyHome';
import { useDashboardStore } from '@/stores/dashboard';
import { UnitService } from '@/api';

import ContactTab from './ContactTab.vue';
import CharacteristicsTab from './CharacteristicsTab.vue';
import CommentsTab from './CommentsTab.vue';
import RemindersTab from './RemindersTab.vue';
import PropertyReminderForm from '../PropertyReminderForm.vue';
import UnitDialog from '../UnitDialog.vue';

const store = usePropertyStore();
const dashboardStore = useDashboardStore();
const { selectedCity } = useDashboardStore();

const showUnitDialog = ref(false);
const showReminderDialog = ref(false);
const activeTab = ref('characteristics');

// Snapshot de la property à l'ouverture pour détecter les modifications
const propertySnapshot = ref<string | null>(null);

const serializeProperty = (prop: any): string => {
  const copy = { ...prop };
  delete copy.comment_rappel;
  return JSON.stringify(copy);
};

// Prendre le snapshot APRÈS le rendu DOM (nextTick) pour capturer
// les valeurs normalisées par les composants (el-input-number, el-switch, etc.)
watch(
  () => store.selectedProperty,
  async newVal => {
    if (store.isDialogVisible && !propertySnapshot.value && newVal) {
      await nextTick();
      // Re-vérifier les conditions après le gap asynchrone
      if (
        store.isDialogVisible &&
        !propertySnapshot.value &&
        store.selectedProperty
      ) {
        propertySnapshot.value = serializeProperty(store.selectedProperty);
      }
    }
  }
);

// Reset du snapshot à la fermeture
watch(
  () => store.isDialogVisible,
  isVisible => {
    if (!isVisible) {
      propertySnapshot.value = null;
    }
  }
);

const propertyType = computed<string>(
  () => (store.selectedProperty as any)?.property_type ?? ''
);

const isTypeUndefined = computed<boolean>(
  () => !propertyType.value || propertyType.value === 'inconnu'
);

// Forcer l'onglet Caractéristiques tant que le type n'est pas défini
watch(isTypeUndefined, isUndefined => {
  if (isUndefined) {
    activeTab.value = 'characteristics';
  }
});

const visible = computed<boolean>({
  get: () => store.isDialogVisible,
  set: async (value: boolean) => {
    if (!value) {
      await handleSaveProperty();
      store.selectProperty(null);
    }
    store.setDialogVisible(value);
  },
});

const isEditing = computed<boolean>(
  () => Number(store.selectedProperty?.id ?? 0) > 0
);

const dialogTitle = computed<string>(() => {
  if (!store.selectedProperty) return 'Nouvelle propriété';

  const codePostal = store.selectedProperty.code_postal || '';
  const city =
    (dashboardStore.selectedCity as any)?.city ||
    store.selectedProperty.nom_commune ||
    store.selectedProperty.city ||
    '';
  const numero = store.selectedProperty.numero || '';
  const rep = store.selectedProperty.rep
    ? ` ${store.selectedProperty.rep}`
    : '';
  const voie = store.selectedProperty.nom_voie || '';

  return `${numero}${rep} ${voie}, ${codePostal} ${city}`;
});

const propertyAddress = computed(() =>
  `${store.selectedProperty?.numero || ''} ${store.selectedProperty?.nom_voie || ''}`.trim()
);

const closeDialog = (): void => {
  visible.value = false;
};

const openUnitDialog = () => {
  showUnitDialog.value = true;
};

const openReminderDialog = () => {
  if (!store.selectedProperty?.id_fantoir_long) return;
  showReminderDialog.value = true;
};

const hasPropertyChanged = (): boolean => {
  if (!store.selectedProperty || !propertySnapshot.value) return false;
  return serializeProperty(store.selectedProperty) !== propertySnapshot.value;
};

const handleSaveProperty = async (): Promise<void> => {
  if (!store.selectedProperty) return;

  if (!hasPropertyChanged()) {
    console.log('Aucune modification détectée, sauvegarde ignorée');
    return;
  }

  const filteredProperty = { ...store.selectedProperty } as any;
  delete filteredProperty.comment_rappel;

  filteredProperty.id_fantoir_long = String(
    store.selectedProperty.id_fantoir_long || ''
  );

  try {
    console.log('saveProperty payload avant envoi', filteredProperty);

    if (isEditing.value) {
      const saved = await store.saveProperty(filteredProperty);
      console.log('property mise à jour', saved);
    } else {
      filteredProperty.city =
        filteredProperty.city ||
        filteredProperty.nom_commune ||
        selectedCity?.value ||
        '';

      const saved = await store.saveProperty(filteredProperty);
      console.log('property créée', saved);
    }

    if (dashboardStore.selectedCodeIdFantoir && dashboardStore.isDataLoaded) {
      await dashboardStore.querySearchAddress();
    }

    ElMessage.success('Propriété sauvegardée');
  } catch (error: any) {
    console.error('Error saving property:', error);
    ElMessage.error(
      error?.response?.data?.message ||
        error?.message ||
        'Erreur lors de la sauvegarde'
    );
  }
};

const createUnit = async (payload: {
  unit_type: string;
  unit_label: string;
}) => {
  if (!store.selectedProperty) return;

  try {
    let rootProperty = store.selectedProperty;

    if (!rootProperty.id || Number(rootProperty.id) === 0) {
      const propertyToCreate = {
        ...rootProperty,
        city: rootProperty.city || rootProperty.nom_commune || '',
      };

      const createdRoot = await store.saveProperty(propertyToCreate);
      rootProperty = createdRoot as any;
      await store.selectProperty(createdRoot as any);
    }

    const unitResponse = await UnitService.save({
      id_fantoir_long: rootProperty.id_fantoir_long,
      id_fantoir: rootProperty.id_fantoir,
      code_insee: rootProperty.code_insee,
      code_postal: rootProperty.code_postal,
      nom_voie: rootProperty.nom_voie,
      numero: rootProperty.numero,
      rep: rootProperty.rep,
      city: rootProperty.city || rootProperty.nom_commune || '',
      unit_type: payload.unit_type,
      unit_label: payload.unit_label,
    });

    const createdUnit = (unitResponse as any)?.unit ?? unitResponse;

    await store.saveProperty({
      id: 0,
      row_type: 'unit',
      unit_id: createdUnit.id,
      id_fantoir_long:
        createdUnit.id_fantoir_long || rootProperty.id_fantoir_long,
      id_fantoir: createdUnit.id_fantoir || rootProperty.id_fantoir,
      code_insee: createdUnit.code_insee || rootProperty.code_insee,
      code_postal: createdUnit.code_postal || rootProperty.code_postal,
      nom_voie: createdUnit.nom_voie || rootProperty.nom_voie,
      numero: createdUnit.numero || rootProperty.numero,
      rep: createdUnit.rep || rootProperty.rep,
      city:
        createdUnit.city || rootProperty.city || rootProperty.nom_commune || '',
      nom_commune:
        createdUnit.city || rootProperty.nom_commune || rootProperty.city || '',
      property_type: payload.unit_type,
      favorite: 0,
    } as any);

    ElMessage.success('Unité créée avec sa property');

    if (dashboardStore.selectedCodeIdFantoir && dashboardStore.isDataLoaded) {
      await dashboardStore.querySearchAddress();
    }
  } catch (error: any) {
    console.error('Erreur création unit:', error);
    console.error('Réponse backend unit:', error?.response?.data);

    ElMessage.error(
      error?.response?.data?.message ||
        error?.message ||
        "Impossible de créer l'unité"
    );
  }
};

const toggleFavorite = async () => {
  if (!store.selectedProperty?.id) return;

  try {
    const savedRow = await store.toggleFavorite(
      store.selectedProperty.id,
      store.selectedProperty
    );

    (store.selectedProperty as any).id = savedRow.id;
    (store.selectedProperty as any).favorite = savedRow.favorite;

    dashboardStore.updateAddress({
      ...(store.selectedProperty as any),
      id: savedRow.id,
      favorite: savedRow.favorite,
    });

    ElMessage({
      message: savedRow.favorite
        ? 'Propriété ajoutée aux favoris'
        : 'Propriété retirée des favoris',
      type: savedRow.favorite ? 'success' : 'info',
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
.property-form {
  margin-bottom: var(--ion-space-6);
  background-color: var(--ion-background-color-primary);
  gap: var(--ion-space-5);
  display: flex;
  flex-direction: column;
  height: 97%;
}

.property-tabs {
}

:deep(.el-tabs__header) {
  margin: 0;
  padding: 0 var(--ion-space-5);
  background-color: var(--ion-background-color);
  border-bottom: var(--ion-border-1) solid var(--ion-card-border-color);
}

:deep(.el-tabs__content) {
  padding: var(--ion-space-5);
}

:deep(.el-tab-pane) {
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-5);
}

:deep(.el-tabs__item) {
  font-weight: 500;
  font-size: var(--ion-text-base);
  padding: 0 var(--ion-space-6);
  height: var(--ion-space-12);
  line-height: var(--ion-space-12);
  color: var(--ion-text-color);
}

:deep(.el-tabs__item.is-active) {
  color: var(--ion-text-color);
  font-weight: var(--ion-font-semibold);
}

:deep(.el-tabs__active-bar) {
  background-color: var(--ion-text-color);
  height: var(--ion-border-3);
}

.title-header {
  font-size: var(--ion-text-lg);
  font-weight: 600;
  color: var(--ion-text-color);
  text-align: center;
  white-space: pre-line;
}

.header-container {
  display: flex;
  justify-content: space-between;
  background-color: var(--ion-background-color);
  align-items: center;
  padding-top: var(--ion-space-5);
  width: 100%;
  padding: 20px;
}

.header-actions {
  display: flex;
  gap: var(--ion-space-3);
  align-items: center;
}

:deep(.el-drawer.ltr) {
  top: unset !important;
}
</style>

<style>
.darker-drawer-overlay {
  background-color: rgba(0, 0, 0, 0.75) !important;
}
</style>
