<template>
  <Teleport to="body">
    <el-drawer
      :model-value="store.isDialogVisible"
      :before-close="closeDialog"
      :size="isMobile ? '98%' : '40%'"
      :show-close="false"
      modal-class="darker-drawer-overlay"
      :style="{
        borderRadius: '20px 0 0 0',
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
            @click="closeDialog()"
          >
            <span>
              <div class="icon-wrapper" style="width: 16px; height: 16px">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  class="icon icon start fill"
                  style="--icon-size: 16px"
                >
                  <path
                    d="M14.3 12.18a.24.24 0 0 1 0-.35l9.26-9.27a1.49 1.49 0 0 0 0-2.12 1.51 1.51 0 0 0-2.12 0L12.18 9.7a.25.25 0 0 1-.36 0L2.56.44a1.51 1.51 0 0 0-2.12 0 1.49 1.49 0 0 0 0 2.12l9.26 9.27a.24.24 0 0 1 0 .35L.44 21.44a1.49 1.49 0 0 0 0 2.12 1.51 1.51 0 0 0 2.12 0l9.26-9.26a.25.25 0 0 1 .36 0l9.26 9.26a1.51 1.51 0 0 0 2.12 0 1.49 1.49 0 0 0 0-2.12Z"
                  />
                </svg>
              </div>
            </span>
          </button>

          <div></div>

          <h4 :id="titleId" class="title-header">{{ dialogTitle }}</h4>

          <div class="header-actions">
            <el-button @click="toggleFavorite" size="small" circle>
              <el-icon>
                <StarFilled
                  v-if="
                    store.isFavorite(store.selectedProperty)
                  "
                  style="color: #f56c6c"
                />
                <Star v-else style="color: #909399" />
              </el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <div class="property-debug">
        <span>Property ID: {{ store.selectedProperty?.id ?? '—' }}</span>
        <span>Unit ID: {{ store.selectedProperty?.unit_id ?? '—' }}</span>
        <span>Row type: {{ store.selectedProperty?.row_type ?? '—' }}</span>

        <span v-if="(store.selectedProperty as any)?.unit?.apart_number">
          Appartement: {{ (store.selectedProperty as any).unit.apart_number }}
        </span>
      </div>

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
              @edit-unit="openEditUnitDialog"
              @type-confirmed="handleSaveProperty"
            />
          </el-tab-pane>

          <el-tab-pane label="Contact" name="contact">
            <ContactTab />
            <ProspectionSection
              v-if="store.isDialogVisible && prospectionTarget"
              :target="prospectionTarget"
              :collective="collectiveProspection"
            />
            <ProspectionSupervisionSection
              v-if="store.isDialogVisible && activeTab === 'contact' && prospectionTarget && collectiveProspection"
              :target="prospectionTarget"
            />
          </el-tab-pane>

          <el-tab-pane label="Commentaires" name="comments" :disabled="isTypeUndefined">
            <CommentsTab />
          </el-tab-pane>

          <el-tab-pane label="Rappels" name="reminders" :disabled="isTypeUndefined">
            <RemindersTab @open-reminder-dialog="openReminderDialog" />
          </el-tab-pane>
          <el-tab-pane label="Estimation" name="automatic-estimate">
            <AutomaticEstimateTab v-if="store.isDialogVisible && activeTab === 'automatic-estimate'"
              :key="store.selectedProperty.id ?? 0" :property-id="Number(store.selectedProperty.id ?? 0)"
              :dirty="propertyHasChanges" :saving="saveInProgress" @save-property="handleSaveProperty"
              @estimate-updated="refreshUnitDvf" />
          </el-tab-pane>
          <el-tab-pane label="Historique DVF" name="dvf-history">
            <DvfHistoryTab v-if="store.isDialogVisible && activeTab === 'dvf-history'"
              :key="store.selectedProperty.id ?? 0"
              :commune="store.selectedProperty.code_insee" :street="store.selectedProperty.id_fantoir"
              :number="store.selectedProperty.numero" :suffix="store.selectedProperty.rep"
              :market-street="store.selectedProperty.prospection_street_key"
              :sold-price-per-m2="store.selectedProperty.dernier_prix_vente_m2"
              :unit="Number(store.selectedProperty.unit_id) > 0"
              :property-id="Number(store.selectedProperty.id)"
              :unit-type="store.selectedProperty.property_type" :links-revision="unitDvfRevision"
              @links-changed="refreshUnitDvf" @unit-lot-loaded="updateLoadedUnitLot"
              @create-unit="openDvfUnitDialog" @open-unit="openLinkedUnit" />
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </el-drawer>

    <ReminderFormDialog
      v-model:visible="showReminderDialog"
      :editing-reminder="null"
      :saving="savingReminder"
      @save="handleSaveReminder"
    />

    <UnitDialog v-model="showUnitDialog" :editing-unit="editingUnit" :initial-values="dvfUnitDraft?.sale"
      :saving="savingDvfUnit" @save="handleSaveUnit" />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { ElForm, ElIcon, ElButton, ElDrawer, ElMessage, ElTabs, ElTabPane } from 'element-plus';
import { Star, StarFilled } from '@element-plus/icons-vue';
import { usePropertyStore } from '@/stores/propertyHome';
import { useDashboardStore } from '@/stores/dashboard';
import { useProspectionScopeStore } from '@/stores/prospectionScope';
import { UnitService } from '@/api';

import ContactTab from './ContactTab.vue';
import ProspectionSection from './ProspectionSection.vue';
import ProspectionSupervisionSection from './ProspectionSupervisionSection.vue';
import { getPersonalPropertyTarget } from '@/api/personal-property.service';
import CharacteristicsTab from './CharacteristicsTab.vue';
import CommentsTab from './CommentsTab.vue';
import RemindersTab from './RemindersTab.vue';
import AutomaticEstimateTab from './AutomaticEstimateTab.vue';
import DvfHistoryTab from './DvfHistoryTab.vue';
//import PropertyReminderForm from '../PropertyReminderForm.vue';
import ReminderFormDialog from '@/views/Reminders/components/ReminderFormDialog.vue';
import { useRemindersStore } from '@/stores/reminders';
import UnitDialog from '../UnitDialog.vue';
import type { DvfUnitDraft } from '@/types/unit';
import useDeviceBreakpoints from '@/composables/isMobile';

const { isMobile } = useDeviceBreakpoints();

const store = usePropertyStore();
const dashboardStore = useDashboardStore();
function refreshUnitDvf() {
  dashboardStore.lastSearchParams = null;
  void dashboardStore.querySearchAddress();
}
function updateLoadedUnitLot(lot: string | null) {
  if (store.selectedProperty?.unit) store.selectedProperty.unit.lot_number = lot;
}
const prospectionScope = useProspectionScopeStore();
const collectiveProspection = computed(() =>
  dashboardStore.activeMainMode === 'prospection' &&
  !!prospectionScope.filters && prospectionScope.filters.scope !== 'me'
);

const showUnitDialog = ref(false);
const showReminderDialog = ref(false);
const editingUnit = ref<any | null>(null);
const dvfUnitDraft = ref<{ parentId: number; sale: DvfUnitDraft }>();
const savingDvfUnit = ref(false);
const unitDvfRevision = ref(0);

watch(showUnitDialog, opened => {
  if (!opened) dvfUnitDraft.value = undefined;
});

function openDvfUnitDialog(sale: DvfUnitDraft) {
  const property = store.selectedProperty;
  const parentId = Number(property?.id);
  if (!parentId || property?.property_type !== 'immeuble' || Number(property.unit_id) > 0) return;
  editingUnit.value = null;
  dvfUnitDraft.value = { parentId, sale };
  showUnitDialog.value = true;
}

async function openLinkedUnit(property: { id: number; unit_id: number }) {
  if (hasPropertyChanged()) {
    ElMessage.warning('Enregistrez les modifications de l’immeuble avant d’ouvrir l’unité.');
    return;
  }
  await store.selectProperty(property);
  if (Number(store.selectedProperty?.id) === property.id) {
    propertySnapshot.value = serializeProperty(store.selectedProperty);
  }
}

const activeTab = ref('characteristics');
watch([() => store.isDialogVisible, () => store.initialDialogTab], ([visible, tab]) => {
  if (visible && tab) activeTab.value = tab;
});

const isEditing = computed<boolean>(() => Number(store.selectedProperty?.id ?? 0) > 0);

const saveInProgress = ref(false);
const saveFailed = ref(false);
const propertySnapshot = ref<string | null>(null);
const prospectionTarget = computed(() => getPersonalPropertyTarget(store.selectedProperty));

const remindersStore = useRemindersStore();

const savingReminder = ref(false);

const handleSaveReminder = async (form: any) => {
  if (!store.selectedProperty?.id) {
    ElMessage.error('La propriété doit être sauvegardée');
    return;
  }

  savingReminder.value = true;

  try {
    await remindersStore.addReminder({
      ...form,
      property_id: store.selectedProperty.id,
      completed: form.status === 'completed',
    });

    ElMessage.success('Rappel créé avec succès');

    showReminderDialog.value = false;
  } catch (error) {
    console.error(error);

    ElMessage.error('Erreur lors de la création du rappel');
  } finally {
    savingReminder.value = false;
  }
};

const serializeProperty = (prop: any): string => {
  if (!prop) return '';

  const copy: any = { ...prop };

  delete copy.comment_rappel;
  delete copy.unit;
  delete copy.created_at;
  delete copy.updated_at;
  delete copy.update_by;
  delete copy.created_by;

  Object.keys(copy).forEach((key) => {
    if (copy[key] === undefined) copy[key] = null;
    if (copy[key] === '') copy[key] = null;

    if (copy[key] === true) copy[key] = 1;
    if (copy[key] === false) copy[key] = 0;
  });

  copy.id = Number(copy.id ?? 0);
  copy.unit_id = Number(copy.unit_id ?? 0) > 0 ? Number(copy.unit_id) : null;
  copy.row_type = copy.row_type || (copy.unit_id ? 'unit' : 'address');

  return JSON.stringify(copy);
};

watch(
  [() => store.isDialogVisible, () => store.selectedProperty],
  async ([isVisible, selected]) => {
    if (!isVisible || !selected) return;
    if (propertySnapshot.value) return;

    await nextTick();

    if (store.isDialogVisible && store.selectedProperty && !propertySnapshot.value) {
      propertySnapshot.value = serializeProperty(store.selectedProperty);
      console.log('SNAPSHOT PROPERTY =', propertySnapshot.value);
    }
  },
  { immediate: true }
);

watch(
  () => store.isDialogVisible,
  (isVisible) => {
    if (!isVisible) {
      propertySnapshot.value = null;
      editingUnit.value = null;
      showUnitDialog.value = false;
      showReminderDialog.value = false;
    }
  }
);

const propertyType = computed<string>(() => (store.selectedProperty as any)?.property_type ?? '');

const isTypeUndefined = computed<boolean>(
  () => !propertyType.value || propertyType.value === 'inconnu'
);

watch(isTypeUndefined, (isUndefined) => {
  if (isUndefined) {
    activeTab.value = 'characteristics';
  }
});

const dialogTitle = computed<string>(() => {
  if (!store.selectedProperty) return 'Nouvelle propriété';

  const codePostal = store.selectedProperty.code_postal || '';
  const city =
    (dashboardStore.selectedCity as any)?.city ||
    store.selectedProperty.nom_commune ||
    store.selectedProperty.city ||
    '';
  const numero = store.selectedProperty.numero || '';
  const rep = store.selectedProperty.rep || '';
  const voie = store.selectedProperty.nom_voie || '';

  return `${numero}${rep} ${voie}, ${codePostal} ${city}`;
});

// const propertyAddress = computed(() =>
//   `${store.selectedProperty?.numero || ''} ${
//     store.selectedProperty?.nom_voie || ''
//   }`.trim()
// );

const closeDialog = async (done?: () => void): Promise<void> => {
  if (saveInProgress.value) return;

  await handleSaveProperty();
  if (saveFailed.value) return;

  done?.();
  store.setDialogVisible(false);

  await nextTick();

  store.selectProperty(null);
};

const openUnitDialog = () => {
  editingUnit.value = null;
  showUnitDialog.value = true;
};

const openEditUnitDialog = () => {
  if (!store.selectedProperty) return;

  const prop = store.selectedProperty as any;

  editingUnit.value = {
    ...(prop.unit ?? {}),
    id: prop.unit?.id ?? store.selectedProperty.unit_id ?? null,
    unit_type: prop.unit?.unit_type ?? store.selectedProperty.property_type ?? 'appartement',
    unit_label: prop.unit?.unit_label ?? store.selectedProperty.unit_label ?? '',
    apart_number: prop.unit?.apart_number ?? store.selectedProperty.apart_number ?? null,
    floor_number: prop.unit?.floor_number ?? store.selectedProperty.floor_number ?? null,
    staircase: prop.unit?.staircase ?? prop.staircase ?? '',
    building: prop.unit?.building ?? prop.building ?? '',
    lot_number: (prop.lot_number !== undefined ? prop.lot_number : prop.unit?.lot_number) ?? '',
  };

  showUnitDialog.value = true;
};

const openReminderDialog = async () => {
  if (!store.selectedProperty?.id_fantoir_long) return;

  const savedProperty = await handleSaveProperty();

  if (savedProperty?.id || Number(store.selectedProperty?.id) > 0) {
    showReminderDialog.value = true;
  }
};

const hasNewPropertyMeaningfulData = (property: any): boolean => {
  const propertyTypeVal = (property.property_type || '').trim().toLowerCase();

  return Boolean(
    (propertyTypeVal &&
      propertyTypeVal !== 'inconnu' &&
      propertyTypeVal !== 'address') ||
    property.owner ||
    property.email ||
    property.phone ||
    Number(property.price ?? 0) > 0 ||
    Number(property.surface ?? 0) > 0 ||
    Number(property.area ?? 0) > 0 ||
    property.comment ||
    property.date_rappel
  );
};

const propertyHasChanges = computed(() => !!store.selectedProperty && !!propertySnapshot.value
  && serializeProperty(store.selectedProperty) !== propertySnapshot.value);
const hasPropertyChanged = () => propertyHasChanges.value;

const handleSaveProperty = async (): Promise<any> => {
  if (saveInProgress.value) {
    console.warn('Sauvegarde déjà en cours, ignorée');
    return store.selectedProperty;
  }

  if (!store.selectedProperty) return null;

  saveInProgress.value = true;
  saveFailed.value = false;

  try {
    if (isEditing.value && !hasPropertyChanged()) {
      console.log('Aucune modification détectée, sauvegarde ignorée');
      return store.selectedProperty;
    }

    const filteredProperty = { ...store.selectedProperty } as any;
    delete filteredProperty.comment_rappel;

    filteredProperty.id_fantoir_long = String(store.selectedProperty.id_fantoir_long || '');

    filteredProperty.row_type =
      filteredProperty.row_type || (Number(filteredProperty.unit_id ?? 0) > 0 ? 'unit' : 'address');

    filteredProperty.unit_id =
      Number(filteredProperty.unit_id ?? 0) > 0 ? Number(filteredProperty.unit_id) : null;

    if (!isEditing.value && !hasNewPropertyMeaningfulData(filteredProperty)) {
      console.log('Nouvelle fiche vide, création ignorée');
      return null;
    }

    console.log('saveProperty payload avant envoi', filteredProperty);

    const saved = await store.saveProperty(filteredProperty);

    if (saved && dashboardStore.isDataLoaded) {
      dashboardStore.updateAddress(saved);
    }

    if (saved) {
      store.selectedProperty = {
        ...store.selectedProperty,
        ...saved,
      };

      await nextTick();

      propertySnapshot.value = serializeProperty(store.selectedProperty);
      if (filteredProperty.unit_id && filteredProperty.lot_number !== undefined) {
        unitDvfRevision.value++;
        refreshUnitDvf();
      }
      ElMessage.success('Propriété sauvegardée');
    }

    return saved;
  } catch (error: any) {
    saveFailed.value = true;
    console.error('Error saving property:', error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || 'Erreur lors de la sauvegarde'
    );
    return null;
  } finally {
    saveInProgress.value = false;
  }
};

const buildUnitPayload = (payload: any, rootProperty: any, unitId?: number) => {
  return {
    id: unitId ?? undefined,

    property_id: rootProperty.id,

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
    apart_number: payload.apart_number ?? null,
    floor_number: payload.floor_number ?? null,
    staircase: payload.staircase || null,
    building: payload.building || null,
    lot_number: payload.lot_number || null,
  };
};

const createUnit = async (payload: any) => {
  if (!store.selectedProperty) return;

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
  const savedUnit = await UnitService.save(buildUnitPayload(payload, rootProperty));

  ElMessage.success('Unité créée avec sa property');

  if (dashboardStore.selectedCodeIdFantoir) {
    dashboardStore.lastSearchParams = null;
    await dashboardStore.querySearchAddress();
  }
  void dashboardStore.refreshProspectionProgress();

  return savedUnit;
};

const updateUnit = async (payload: any) => {
  if (!store.selectedProperty) return;

  const prop = store.selectedProperty as any;
  const unitId =
    Number(editingUnit.value?.id ?? 0) ||
    Number(prop.unit?.id ?? 0) ||
    Number(store.selectedProperty.unit_id ?? 0);

  if (!unitId) {
    throw new Error("Impossible de retrouver l'identifiant de l'unité");
  }

  const savedUnit = await UnitService.save(
    buildUnitPayload(payload, store.selectedProperty, unitId)
  );

  (store.selectedProperty as any) = {
    ...store.selectedProperty,
    ...savedUnit.property,
    lot_number: undefined,
    row_type: 'unit',
    unit_id: savedUnit.unit.id ?? unitId,
    unit: savedUnit.unit,
  };

  if (dashboardStore.isDataLoaded) {
    dashboardStore.updateAddress(store.selectedProperty as any);
  }

  propertySnapshot.value = serializeProperty(store.selectedProperty);

  ElMessage.success('Unité modifiée');
  unitDvfRevision.value++;
  refreshUnitDvf();

  return savedUnit;
};

const handleSaveUnit = async (payload: any) => {
  const draft = dvfUnitDraft.value;
  if (savingDvfUnit.value) return;
  try {
    if (draft) {
      const parent = store.selectedProperty;
      if (!parent || Number(parent.id) !== draft.parentId) {
        throw new Error('L’immeuble sélectionné a changé. Rouvrez la vente depuis son historique.');
      }
      savingDvfUnit.value = true;
      await UnitService.save({
        ...buildUnitPayload(payload, parent),
        dvf_sale_key: draft.sale.key,
        surface: payload.surface,
        rooms: payload.rooms,
      });
      unitDvfRevision.value++;
      refreshUnitDvf();
      void dashboardStore.refreshProspectionProgress();
      ElMessage.success('Unité créée et vente DVF rattachée.');
    } else if (editingUnit.value?.id || store.selectedProperty?.unit_id) {
      await updateUnit(payload);
    } else {
      await createUnit(payload);
    }

    showUnitDialog.value = false;
    editingUnit.value = null;
  } catch (error: any) {
    console.error('Erreur sauvegarde unit:', error);
    console.error('Réponse backend unit:', error?.response?.data);

    ElMessage.error(
      error?.response?.data?.message || error?.message || "Impossible de sauvegarder l'unité"
    );
    if (draft && error?.response?.status === 409) unitDvfRevision.value++;
  } finally {
    if (draft) savingDvfUnit.value = false;
  }
};

const toggleFavorite = async () => {
  if (!store.selectedProperty) return;

  try {
    const favorite = await store.setFavorite(store.selectedProperty);

    ElMessage({
      message: favorite
        ? 'Propriété ajoutée aux favoris'
        : 'Propriété retirée des favoris',
      type: favorite ? 'success' : 'info',
      duration: 2000,
    });
  } catch (error) {
    ElMessage({
      message: 'Impossible de modifier le favori.',
      type: 'error',
      duration: 3000,
    });
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (store.isDialogVisible && e.key === 'Enter') {
    const target = e.target as HTMLElement;

    if (activeTab.value === 'automatic-estimate' || target.tagName.toLowerCase() === 'textarea' || target.closest('.prospection-section')) {
      return;
    }

    e.preventDefault();
    closeDialog();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
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
  border-radius: 20px 20px 0 0;
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

.property-debug {
  display: flex;
  gap: 12px;
  justify-content: center;
  font-size: 12px;
  color: #64748b;
  margin-top: 6px;
}
</style>
