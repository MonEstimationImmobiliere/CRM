<template>
  <div class="reminders-page">
    <!-- Header bar: title + add button + view toggle -->
    <EMCard class="headerFilterInfoContainer" :border-hover="false">
      <div class="headerTopRow">
        <h2>Mes Rappels</h2>

        <div class="headerRightContainer">
          <ViewToggle v-model="currentRemindersView" :options="viewOptions" />
        </div>
      </div>

      <div class="headerBottomRow">
        <!-- Scope filters -->
        <RemindersFilters
          v-model:sharing-filter="sharingFilter"
          v-model:selected-user="selectedUser"
          v-model:selected-agency="selectedAgency"
          :user-role="userStore.role"
        />

        <!-- Completed / À faire toggle -->
        <el-radio-group v-model="completedFilter" class="completed-toggle">
          <el-radio-button :label="false">À faire</el-radio-button>
          <el-radio-button :label="true">Terminé</el-radio-button>
        </el-radio-group>

        <el-button type="primary" @click="openNewReminderDialog" class="add-reminder-btn">
          <el-icon><Plus /></el-icon>
          Nouveau rappel
        </el-button>
      </div>
    </EMCard>

    <!-- Statistics Cards -->

    <!-- <ReminderStatsBar
      :overdue-count="overdueReminders.length"
      :today-count="todayReminders.length"
      :upcoming-count="upcomingReminders.length"
      :completed-count="completedReminders.length"
    /> -->

    <!-- Reminders List -->
    <div
      class="reminders-list"
      :class="{ 'reminders-list--calendar': currentRemindersView === 'calendar' }"
    >
      <el-card v-if="filteredReminders.length === 0" class="empty-state">
        <div class="empty-content">
          <el-icon class="empty-icon"><Document /></el-icon>
          <h3>Aucun rappel trouvé</h3>
          <p>{{ emptyMessage }}</p>
          <el-button type="primary" @click="showCreateDialog = true" style="margin-top: 16px">
            <el-icon><Plus /></el-icon>
            Créer mon premier rappel
          </el-button>
        </div>
      </el-card>

      <!-- Table View -->
      <EMTableWithCard
        v-else-if="currentRemindersView === 'table'"
        :data="filteredReminders"
        :columns="reminderColumns"
        :actions="reminderActions"
        :searchable="true"
        search-placeholder="Rechercher un rappel..."
        :page-size="20"
        :navigateFromLine="(row: Reminder) => handleAction({ action: 'edit', reminder: row })"
      >
        <!-- Address -->
        <template #cell-address="{ row }">
          <div class="address-cell">
            <template v-if="row.property">
              <strong>{{ getBasePropertyAddress(row.property) }}</strong>
              <span v-if="getPropertyUnitLabel(row.property)">
                {{ getPropertyUnitLabel(row.property) }}
              </span>
            </template>
            <span v-else>Rappel Général</span>
          </div>
        </template>

        <!-- Owner -->
        <template #cell-owner="{ row }">
          <span class="owner-name">{{ row.property?.owner ?? '-' }}</span>
        </template>

        <!-- Date -->
        <template #cell-date="{ row }">
          <div class="date-block" :class="getDateBlockClass(row)">
            <strong>{{ formatShortDate(row.date) }}</strong>
            <span>{{ getDaysLeftText(row) }}</span>
          </div>
        </template>

        <!-- Type -->
        <template #cell-type="{ row }">
          <span v-if="row.type" class="type-badge" :class="'type--' + row.type">
            {{ getTypeLabel(row.type) }}
          </span>
          <span v-else class="muted">—</span>
        </template>

        <!-- Description -->
        <template #cell-description="{ row }">
          <div class="label-cell">
            <p :class="{ done: isReminderCompleted(row) }">
              {{ row.description || 'Aucun détail' }}
            </p>
          </div>
        </template>

        <!-- Agent -->
        <template #cell-agent="{ row }">
          <span class="agent-name" :title="row.creator?.email">
            {{ row.creator?.name ?? '—' }}
          </span>
        </template>

        <!-- Completed toggle -->
        <template #cell-completed="{ row }">
          <EMToggleSwitch
            :model-value="isReminderCompleted(row)"
            @update:model-value="(val: boolean) => updateStatus(row, val ? 'completed' : 'todo')"
          />
        </template>

        <!-- Sharing toggle -->
        <template #cell-sharing="{ row }">
          <EMToggleSwitch
            :model-value="!!row.sharing"
            @update:model-value="(val: boolean) => updateSharing(row, val)"
          />
        </template>
      </EMTableWithCard>

      <!-- Card View -->
      <div v-else-if="currentRemindersView === 'card'" class="reminders-grid">
        <ReminderCard
          v-for="reminder in filteredReminders"
          :key="reminder.id"
          :reminder="reminder"
          :user-role="userStore.role"
          @action="handleAction"
          @update-status="updateStatus"
        />
      </div>

      <!-- Calendar View -->
      <ReminderCalendarView
        v-else-if="currentRemindersView === 'calendar'"
        :reminders="filteredReminders"
        @edit-reminder="editReminder"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <ReminderFormDialog
      v-model:visible="showCreateDialog"
      :editing-reminder="editingReminder"
      :saving="saving"
      @save="saveReminder"
      @open-property="openProperty"
    />

    <!-- Property Dialog -->
    <PropertyForm />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRemindersStore, type Reminder } from '@/stores/reminders';
import { useUserStore } from '@/stores/user';
import { usePropertyStore } from '@/stores/propertyHome';
import { useDashboardStore } from '@/stores/dashboard';
import { Plus, Document } from '@element-plus/icons-vue';
import { DataBoard, Grid, Calendar as CalendarIcon } from '@element-plus/icons-vue';
import ViewToggle from '@/components/ViewToggle.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { sortReminders, getTypeLabel } from '@/utils/reminderHelpers';

import RemindersFilters from './components/RemindersFilters.vue';
import ReminderCard from './components/ReminderCard.vue';
import ReminderFormDialog from './components/ReminderFormDialog.vue';
import ReminderCalendarView from './components/ReminderCalendarView.vue';
import type { ColumnDefinition, TableAction } from '@/components/OwnReusableComponents/table/types';
import type { IReminderProperty } from '@/types/reminder';
import PropertyForm from '@/views/DashboardComponents/PropertyDialog/index.vue';
import { PropertyService } from '@/api';
import type { ReminderFormData } from './components/ReminderFormDialog.vue';

const remindersStore = useRemindersStore();
const propertyStore = usePropertyStore();
const dashboardStore = useDashboardStore();
const userStore = useUserStore();
const router = useRouter();

// Reactive state
const activeFilter = ref('all');
const typeFilter = ref('');
const priorityFilter = ref('');
const sharingFilter = ref('all');
const selectedUser = ref<number | null>(null);
const selectedAgency = ref<number | null>(null);
const completedFilter = ref(false);
const showCreateDialog = ref(false);
const editingReminder = ref<Reminder | null>(null);
const saving = ref(false);

const openedPropertyId = ref<number | null>(null);

const openNewReminderDialog = () => {
  editingReminder.value = null;
  showCreateDialog.value = true;
};
// Store destructuring
const { todayReminders, upcomingReminders, overdueReminders, completedReminders } = remindersStore;

const isReminderCompleted = (r: Reminder): boolean => {
  return r.completed === true || (r.completed as unknown) === 1 || (r.completed as unknown) === '1';
};

// ── Table columns & actions ──────────────────────────────
const reminderColumns: ColumnDefinition<Reminder>[] = [
  { key: 'address', label: 'Adresse du bien', sortable: false, width: '260px' },
  {
    key: 'owner',
    label: 'Propriétaire',
    sortable: false,
    width: '160px',
    filterMenu: true,
  },
  { key: 'date', label: 'Échéance', width: '130px' },
  { key: 'type', label: 'Type', width: '120px', filterMenu: true },
  { key: 'description', label: 'Libellé', sortable: false, width: '120px' },
  {
    key: 'agent',
    label: 'Agent',
    sortable: false,
    width: '150px',
    filterMenu: true,
  },
  {
    key: 'completed',
    label: 'Fait',
    sortable: false,
    width: '80px',
    align: 'center',
  },
  {
    key: 'sharing',
    label: 'Partage',
    sortable: false,
    width: '90px',
    align: 'center',
  },
];

const reminderActions: TableAction<Reminder>[] = [
  {
    key: 'open-property',
    label: 'Ouvrir le bien',
    icon: '📋',
    disabled: (row) => !row.property_id,
    handler: (row) => handleAction({ action: 'open-property', reminder: row }),
  },
  {
    key: 'edit',
    label: 'Modifier le rappel',
    icon: '✏️',
    handler: (row) => handleAction({ action: 'edit', reminder: row }),
  },
  {
    key: 'new-reminder',
    label: 'Nouveau rappel lié',
    icon: '➕',
    disabled: (row) => !row.property_id,
    handler: (row) => handleAction({ action: 'new-reminder', reminder: row }),
  },
  {
    key: 'go-to-map',
    label: 'Voir sur la carte',
    icon: '📍',
    disabled: (row) => !row.property_id,
    handler: (row) => handleAction({ action: 'go-to-map', reminder: row }),
  },
];

// ── Table helper functions ──────────────────────────────
const getBasePropertyAddress = (property: IReminderProperty): string => {
  const parts: string[] = [];
  if (property.numero) parts.push(String(property.numero));
  if (property.rep) parts.push(property.rep);
  if (property.nom_voie) parts.push(property.nom_voie);
  const cityLine = `${property.code_postal ?? ''} ${property.city ?? ''}`.trim();
  if (cityLine) parts.push(cityLine);
  return parts.join(' ');
};

const getPropertyUnitLabel = (property: IReminderProperty): string => {
  const p = property as any;
  const unit = p.unit;
  if (!unit) return '';
  if (unit.unit_label) return unit.unit_label;
  if (unit.apart_number) return `Appartement ${unit.apart_number}`;
  if (unit.unit_type) return unit.unit_type;
  return '';
};

const getDiffDays = (date: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
};

const getDaysLeftText = (r: Reminder): string => {
  if (isReminderCompleted(r)) return 'Terminé';
  const d = getDiffDays(r.date);
  if (d < 0) return `${Math.abs(d)}j de retard`;
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Demain';
  return `J-${d}`;
};

const getDateBlockClass = (r: Reminder): string => {
  if (isReminderCompleted(r)) return 'done';
  const d = getDiffDays(r.date);
  if (d < 0) return 'overdue';
  if (d <= 3) return 'warning';
  return 'ok';
};

// Filtered & sorted reminders
const filteredReminders = computed(() => {
  let filtered = [...remindersStore.reminders];

  filtered = filtered.filter((r) =>
    completedFilter.value ? isReminderCompleted(r) : !isReminderCompleted(r)
  );

  if (typeFilter.value) {
    filtered = filtered.filter((r) => r.type === typeFilter.value);
  }

  if (priorityFilter.value) {
    filtered = filtered.filter((r) => r.priority === priorityFilter.value);
  }

  return sortReminders(filtered);
});
// Resolve sharingFilter to API scope
const getApiScope = (): 'me' | 'all' | 'agency' | 'user' => {
  if (sharingFilter.value === 'personal') return 'me';
  if (sharingFilter.value === 'user') return 'user';
  if (sharingFilter.value === 'agency') return 'agency';
  return 'all';
};

watch(
  () => showCreateDialog.value,
  (isVisible) => {
    if (!isVisible) {
      editingReminder.value = null;
    }
  }
);

// Reload when any filter changes (immediate: true triggers the initial fetch on mount)
watch(
  [sharingFilter, selectedUser, selectedAgency, completedFilter],
  () => {
    const scope = getApiScope();
    if (scope === 'user' && !selectedUser.value) return; // wait for user selection
    remindersStore.loadRemindersByScope(scope, {
      userId: selectedUser.value ?? undefined,
      agencyId: selectedAgency.value ?? undefined,
      completed: completedFilter.value,
    });
  },
  { immediate: true }
);

watch(
  () => propertyStore.isDialogVisible,
  async (isVisible, wasVisible) => {
    if (wasVisible && !isVisible) {
      const savedProperty = propertyStore.selectedProperty
        ? { ...propertyStore.selectedProperty }
        : null;

      try {
        const scope = getApiScope();

        await remindersStore.loadRemindersByScope(scope, {
          userId: selectedUser.value ?? undefined,
          agencyId: selectedAgency.value ?? undefined,
          completed: completedFilter.value,
        });

        if (savedProperty?.id) {
          remindersStore.reminders.forEach((reminder: any) => {
            if (Number(reminder.property_id) === Number(savedProperty.id)) {
              reminder.property = {
                ...(reminder.property || {}),
                ...savedProperty,
              };
            }
          });
        }

        openedPropertyId.value = null;

        console.log('Reminders rechargés + property patchée après fermeture');
      } catch (error) {
        console.error('Erreur refresh reminders après property dialog:', error);
        ElMessage.error('Erreur lors du rafraîchissement des rappels');
      }
    }
  }
);

// Empty state message
const emptyMessage = computed(() => {
  const messages: Record<string, string> = {
    overdue: 'Aucun rappel en retard. Excellent !',
    today: "Aucun rappel pour aujourd'hui.",
    upcoming: 'Aucun rappel à venir cette semaine.',
    completed: 'Aucun rappel terminé.',
  };
  return messages[activeFilter.value] ?? 'Commencez par créer votre premier rappel.';
});

const createNewReminderFromProperty = (reminder: Reminder) => {
  editingReminder.value = {
    ...reminder,

    id: 0,

    title: 'Rappel',

    description: '',

    date: new Date().toISOString().split('T')[0],

    status: 'todo',

    completed: false,
  } as any;

  showCreateDialog.value = true;
};

// Action handler from ReminderCard dropdown
const handleAction = ({ action, reminder }: { action: string; reminder: Reminder }) => {
  if (action === 'edit') editReminder(reminder);
  else if (action === 'delete') deleteReminder(reminder);
  else if (action === 'new-reminder') createNewReminderFromProperty(reminder);
  else if (action === 'open-property') openProperty(reminder);
  else if (action === 'go-to-map') goToMap(reminder);
};

const editReminder = (reminder: Reminder) => {
  editingReminder.value = reminder;
  showCreateDialog.value = true;
};

const duplicateReminder = async (reminder: Reminder) => {
  try {
    await remindersStore.addReminder({
      title: `${reminder.title} (Copie)`,
      description: reminder.description || '',
      date: reminder.date,
      type: reminder.type,
      priority: reminder.priority,
      sharing: reminder.sharing || false,
      property_id: reminder.property_id,
      completed: false,
    });
    ElMessage.success('Rappel dupliqué avec succès');
  } catch {
    ElMessage.error('Erreur lors de la duplication du rappel');
  }
};

const deleteReminder = async (reminder: Reminder) => {
  try {
    await ElMessageBox.confirm('Êtes-vous sûr de vouloir supprimer ce rappel ?', 'Confirmation', {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    });
    remindersStore.deleteReminder(reminder.id);
    ElMessage.success('Rappel supprimé avec succès');
  } catch {
    // User cancelled
  }
};

// Save handler from ReminderFormDialog (validation is done in the dialog)
const saveReminder = async (form: ReminderFormData, editing: Reminder | null) => {
  saving.value = true;
  try {
    const payload = { ...form, completed: form.status === 'completed' };

    if (editing) {
      await remindersStore.updateReminder(editing.id, payload);
      ElMessage.success('Rappel modifié avec succès');
    } else {
      await remindersStore.addReminder(payload);
      ElMessage.success('Rappel créé avec succès');
    }

    showCreateDialog.value = false;
    editingReminder.value = null;
  } catch {
    ElMessage.error('Erreur lors de la sauvegarde du rappel');
  } finally {
    saving.value = false;
  }
};

// Status update from ReminderCard buttons
const updateStatus = async (reminder: Reminder, status: 'todo' | 'progress' | 'completed') => {
  try {
    await remindersStore.updateReminderStatus(reminder.id, status);

    await remindersStore.loadRemindersByScope(getApiScope(), {
      userId: selectedUser.value ?? undefined,
      agencyId: selectedAgency.value ?? undefined,
      completed: completedFilter.value,
    });

    ElMessage.success(
      status === 'completed' ? 'Rappel marqué comme terminé' : 'Rappel marqué comme à faire'
    );
  } catch (error) {
    console.error(error);
    ElMessage.error('Erreur lors de la mise à jour du statut');
  }
};

const updateSharing = async (reminder: Reminder, sharing: boolean) => {
  try {
    await remindersStore.updateReminder(reminder.id, { sharing });
    ElMessage.success(sharing ? "Rappel partagé avec l'agence" : 'Rappel repassé en privé');
  } catch {
    ElMessage.error('Erreur lors de la mise à jour du partage');
  }
};

const viewOptions = [
  { value: 'table', label: 'Vue tableau', icon: DataBoard },
  { value: 'card', label: 'Vue cartes', icon: Grid },
  { value: 'calendar', label: 'Vue calendrier', icon: CalendarIcon },
];

const currentRemindersView = computed({
  get: () => remindersStore.remindersViewType,
  set: (v: string) => remindersStore.setRemindersViewType(v as 'table' | 'card' | 'calendar'),
});

const openProperty = async (reminder: Reminder) => {
  try {
    const propertyId = Number(reminder.property?.id ?? 0) || Number(reminder.property_id ?? 0);

    if (propertyId <= 0) {
      ElMessage.error('Aucune propriété liée à ce rappel');
      return;
    }

    openedPropertyId.value = propertyId;

    const response: any = await PropertyService.getProperty(propertyId);

    const fullProperty =
      response?.property ?? response?.data?.property ?? response?.data ?? response;

    if (!fullProperty || Number(fullProperty.id ?? 0) <= 0) {
      ElMessage.error('Propriété introuvable');
      return;
    }

    const unitId = Number(fullProperty.unit?.id ?? 0) || Number(fullProperty.unit_id ?? 0);

    const normalizedProperty = {
      ...fullProperty,

      id: Number(fullProperty.id),

      unit_id: unitId > 0 ? unitId : null,

      row_type: unitId > 0 ? 'unit' : 'address',
    };

    console.log('OPEN PROPERTY FROM REMINDER', normalizedProperty);

    showCreateDialog.value = false;
    editingReminder.value = null;

    await propertyStore.selectProperty(normalizedProperty);

    propertyStore.setDialogVisible(true);
  } catch (error) {
    console.error('OPEN PROPERTY ERROR', error);

    ElMessage.error("Impossible d'ouvrir la fiche de la propriété");
  }
};

const goToMap = async (reminder: Reminder) => {
  const propertyId = Number(reminder.property?.id ?? 0) || Number(reminder.property_id ?? 0);

  if (propertyId <= 0) {
    ElMessage.error('Aucune propriété liée à ce rappel');
    return;
  }

  try {
    const response: any = await PropertyService.getProperty(propertyId);
    const fullProperty =
      response?.property ?? response?.data?.property ?? response?.data ?? response;

    if (!fullProperty) {
      ElMessage.error('Propriété introuvable');
      return;
    }

    const city = fullProperty.city || fullProperty.nom_commune || '';
    const codeInsee = fullProperty.code_insee || fullProperty.code_commune || '';
    const idFantoir = fullProperty.id_fantoir || '';
    const numero = fullProperty.numero ? String(fullProperty.numero) : '';
    const rep = fullProperty.rep || '';

    dashboardStore.lastSearchParams = null;

    dashboardStore.setSearchParams(
      city ? { value: city, codeInsee, code_insee: codeInsee } : null,
      fullProperty.nom_voie ? { value: fullProperty.nom_voie, idFantoir } : null,
      codeInsee,
      idFantoir
    );

    dashboardStore.selectedNumero = numero;
    dashboardStore.selectedRep = rep;
    dashboardStore.viewType = 'map';

    await dashboardStore.querySearchAddress();

    router.push('/');
  } catch (error) {
    console.error('GO TO MAP ERROR', error);
    ElMessage.error('Impossible de localiser la propriété sur la carte');
  }
};
</script>

<style scoped>
/* ── Header ──────────────────────────────── */
.headerFilterInfoContainer {
  margin-bottom: 20px;
  border-radius: var(--apple-radius);
}

.headerTopRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
  flex-wrap: wrap;
}

.headerTopRow h1 {
  margin: 0;
  color: var(--page-title-color);
  font-size: var(--page-title-size);
  font-weight: var(--page-title-weight);
}

.headerRightContainer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.headerBottomRow {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.completed-toggle {
  margin-left: 4px;
}

.add-reminder-btn {
  border-radius: var(--btn-radius);
  font-weight: 600;
}

/* ── List area ───────────────────────────── */
.reminders-list {
  min-height: var(--empty-state-min-height);
}

/* In calendar mode, remove min-height so the calendar controls its own height */
.reminders-list--calendar {
  min-height: 0;
}

/* ── Empty state ─────────────────────────── */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px dashed #cbd5e1;
  border-radius: var(--card-radius);
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  color: #94a3b8;
  margin-bottom: 20px;
}

.empty-content h3 {
  color: #374151;
  margin-bottom: 12px;
  font-size: 1.25rem;
}

.empty-content p {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 0;
}

/* ── Card grid ───────────────────────────── */
.reminders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--grid-min-col), 1fr));
  gap: var(--grid-gap);
}

/* ── Responsive ──────────────────────────── */
@media (max-width: 768px) {
  .reminders-page {
    padding: 16px;
  }

  .reminders-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-right {
    justify-content: space-between;
  }

  /* Stack the header rows on mobile */
  .headerTopRow {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .headerRightContainer {
    justify-content: flex-end;
  }

  .headerBottomRow {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .add-reminder-btn {
    width: 100%;
    justify-content: center;
  }

  .completed-toggle {
    margin-left: 0;
    width: 100%;
  }

  .completed-toggle :deep(.el-radio-group) {
    display: flex;
    width: 100%;
  }

  .completed-toggle :deep(.el-radio-button) {
    flex: 1;
    text-align: center;
  }

  .reminders-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .reminders-page {
    padding: 12px;
  }

  .reminders-header h1 {
    font-size: 1.5rem;
  }

  .empty-state {
    padding: 60px 16px;
  }

  .reminders-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* ── Table cell custom styles ────────────── */
.address-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.address-cell strong {
  font-size: 0.875rem;
}

.address-cell span {
  font-size: 0.75rem;
  color: #6b7280;
}

.owner-name {
  font-size: 0.875rem;
}

.date-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-block strong {
  font-size: 0.875rem;
}

.date-block span {
  font-size: 0.7rem;
}

.date-block.overdue {
  color: #dc2626;
}

.date-block.warning {
  color: #d97706;
}

.date-block.ok {
  color: #16a34a;
}

.date-block.done {
  color: #6b7280;
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #e5e7eb;
  color: #374151;
}

.type--call {
  background: #dbeafe;
  color: #1d4ed8;
}

.type--visit {
  background: #dcfce7;
  color: #15803d;
}

.type--email {
  background: #fef3c7;
  color: #92400e;
}

.type--task {
  background: #ede9fe;
  color: #6d28d9;
}

.muted {
  color: #9ca3af;
}

.label-cell p {
  margin: 0;
  font-size: 0.875rem;
}

.label-cell p.done {
  text-decoration: line-through;
  color: #9ca3af;
}

.agent-name {
  font-size: 0.875rem;
}
</style>
