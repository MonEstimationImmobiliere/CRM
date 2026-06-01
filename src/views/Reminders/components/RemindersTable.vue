label_cell
<template>
  <div class="reminders-table-container">
    <div class="table-wrapper">
      <table class="rt-table">
        <thead>
          <tr>
            <th style="width: 260px">Adresse du bien</th>
            <th style="width: 160px">
              <div class="th-filter">
                <span>Propriétaire</span>
                <el-popover placement="bottom" :width="200" trigger="click">
                  <template #reference>
                    <el-icon
                      class="filter-icon"
                      :class="{ active: selectedOwners.length > 0 }"
                    >
                      <Filter />
                    </el-icon>
                  </template>
                  <div class="agent-filter-panel">
                    <el-checkbox-group v-model="selectedOwners">
                      <el-checkbox
                        v-for="owner in ownerFilters"
                        :key="owner"
                        :label="owner"
                        :value="owner"
                      />
                    </el-checkbox-group>
                    <el-button
                      v-if="selectedOwners.length > 0"
                      size="small"
                      link
                      @click="clearOwnerFilter"
                      style="margin-top: 8px"
                    >
                      Réinitialiser
                    </el-button>
                  </div>
                </el-popover>
              </div>
            </th>
            <th style="width: 130px">Échéance</th>
            <th style="width: 120px">Type</th>
            <th>Libellé</th>
            <th style="width: 150px">
              <div class="th-filter">
                <span>Agent</span>
                <el-popover placement="bottom" :width="200" trigger="click">
                  <template #reference>
                    <el-icon
                      class="filter-icon"
                      :class="{ active: selectedAgents.length > 0 }"
                    >
                      <Filter />
                    </el-icon>
                  </template>
                  <div class="agent-filter-panel">
                    <el-checkbox-group v-model="selectedAgents">
                      <el-checkbox
                        v-for="agent in agentFilters"
                        :key="agent"
                        :label="agent"
                        :value="agent"
                      />
                    </el-checkbox-group>
                    <el-button
                      v-if="selectedAgents.length > 0"
                      size="small"
                      link
                      @click="clearAgentFilter"
                      style="margin-top: 8px"
                    >
                      Réinitialiser
                    </el-button>
                  </div>
                </el-popover>
              </div>
            </th>
            <th style="width: 80px">Fait</th>
            <th style="width: 90px">Partage</th>
            <th style="width: 190px">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="reminder in filteredReminders"
            :key="reminder.id"
            class="rt-row"
            :class="getRowClass(reminder)"
            @click="$emit('action', { action: 'edit', reminder })"
          >
            <td>
              <div class="address-cell">
                <!--<pre style="font-size: 10px; white-space: pre-wrap">
{{ reminder }}
    </pre>-->

                <template v-if="reminder.property">
                  <strong>{{
                    getBasePropertyAddress(reminder.property)
                  }}</strong>

                  <span v-if="getPropertyUnitLabel(reminder.property)">
                    {{ getPropertyUnitLabel(reminder.property) }}
                  </span>
                </template>

                <span v-else>Rappel Général</span>
              </div>
            </td>

            <td>
              <span class="owner-name">
                {{ reminder.property?.owner ?? '-' }}
              </span>
            </td>

            <td>
              <div class="date-block" :class="getDateBlockClass(reminder)">
                <strong>{{ formatShortDate(reminder.date) }}</strong>
                <span>{{ getDaysLeftText(reminder) }}</span>
              </div>
            </td>

            <td>
              <span
                v-if="reminder.type"
                class="type-badge"
                :class="'type--' + reminder.type"
              >
                {{ getTypeLabel(reminder.type) }}
              </span>
              <span v-else class="muted">—</span>
            </td>

            <td>
              <div class="label-cell">
                <p :class="{ done: isReminderCompleted(reminder) }">
                  {{ reminder.description || 'Aucun détail' }}
                </p>
              </div>
            </td>

            <td>
              <span class="agent-name" :title="reminder.creator?.email">
                {{ reminder.creator?.name ?? '—' }}
              </span>
            </td>

            <td class="center" @click.stop>
              <EMToggleSwitch
                :model-value="isReminderCompleted(reminder)"
                @update:model-value="
                  val =>
                    $emit('update-status', reminder, val ? 'completed' : 'todo')
                "
              />
            </td>

            <td class="center" @click.stop>
              <EMToggleSwitch
                :model-value="!!reminder.sharing"
                @update:model-value="
                  val => $emit('update-sharing', reminder, val)
                "
              />
            </td>

            <td class="actions-cell" @click.stop>
              <div class="actions-wrapper">
                <el-button
                  size="default"
                  type="primary"
                  circle
                  :disabled="!reminder.property_id"
                  @click="
                    $emit('action', { action: 'open-property', reminder })
                  "
                  title="Ouvrir le bien"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>

                <el-button
                  size="default"
                  plain
                  circle
                  @click="$emit('action', { action: 'edit', reminder })"
                  title="Modifier le rappel"
                >
                  <el-icon><EditPen /></el-icon>
                </el-button>

                <el-button
                  size="default"
                  type="success"
                  circle
                  :disabled="!reminder.property_id"
                  @click="$emit('action', { action: 'new-reminder', reminder })"
                  title="Créer un rappel lié à ce bien"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>

                <el-button
                  size="default"
                  type="warning"
                  circle
                  :disabled="!reminder.property_id"
                  @click="$emit('action', { action: 'go-to-map', reminder })"
                  title="Voir sur la carte"
                >
                  <el-icon><Location /></el-icon>
                </el-button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredReminders.length === 0" class="rt-empty">
        {{
          selectedAgents.length > 0 || selectedOwners.length > 0
            ? 'Aucun rappel pour les filtres sélectionnés'
            : 'Aucun rappel trouvé'
        }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Edit } from '@element-plus/icons-vue';
import type { Reminder } from '@/stores/reminders';
import type { IReminderProperty } from '@/types/reminder';
import EMToggleSwitch from '@/components/OwnReusableComponents/switch/EMToggleSwitch.vue';
import { getTypeLabel, isOverdue, isToday } from '@/utils/reminderHelpers';
import { EditPen, Plus, Filter, Location } from '@element-plus/icons-vue';

interface ActionCommand {
  action: string;
  reminder: Reminder;
}

const props = defineProps<{
  reminders: Reminder[];
  userRole: string;
}>();

const selectedAgents = ref<string[]>([]);
const selectedOwners = ref<string[]>([]);

const agentFilters = computed(() => {
  const names = new Set<string>();
  for (const r of props.reminders) {
    const name = r.creator?.name;
    if (name) names.add(name);
  }
  return [...names].sort();
});

const ownerFilters = computed(() => {
  const owners = new Set<string>();
  for (const r of props.reminders) {
    const owner = r.property?.owner;
    if (owner) owners.add(owner);
  }
  return [...owners].sort();
});

const filteredReminders = computed(() => {
  let list = props.reminders;
  if (selectedAgents.value.length > 0) {
    list = list.filter(r => {
      const name = r.creator?.name ?? '';
      return selectedAgents.value.includes(name);
    });
  }
  if (selectedOwners.value.length > 0) {
    list = list.filter(r => {
      const owner = r.property?.owner ?? '';
      return selectedOwners.value.includes(owner);
    });
  }
  return list;
});

const clearAgentFilter = () => {
  selectedAgents.value = [];
};

const clearOwnerFilter = () => {
  selectedOwners.value = [];
};

defineEmits<{
  action: [command: ActionCommand];
  'update-status': [reminder: Reminder, status: 'todo' | 'completed'];
  'update-sharing': [reminder: Reminder, sharing: boolean];
}>();

const getBasePropertyAddress = (property: IReminderProperty): string => {
  const parts: string[] = [];

  if (property.numero) parts.push(String(property.numero));
  if (property.rep) parts.push(property.rep);
  if (property.nom_voie) parts.push(property.nom_voie);

  const cityLine =
    `${property.code_postal ?? ''} ${property.city ?? ''}`.trim();
  if (cityLine) parts.push(cityLine);

  return parts.join(' ');
};

const isReminderCompleted = (r: Reminder): boolean => {
  return r.completed === true;
};

const getPropertyUnitLabel = (property: IReminderProperty): string => {
  const p = property as any;
  const unit = p.unit;

  if (!unit) return '';

  if (unit.unit_label) {
    return unit.unit_label;
  }

  if (unit.apart_number) {
    return `Appartement ${unit.apart_number}`;
  }

  if (unit.unit_type) {
    return unit.unit_type;
  }

  return '';
};

const getDiffDays = (date: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
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

const getRowClass = (r: Reminder): string => {
  if (isReminderCompleted(r)) return 'row-done';
  if (isOverdue(r.date, isReminderCompleted(r))) return 'row-overdue';
  if (isToday(r.date)) return 'row-today';
  return '';
};
</script>

<style scoped>
.reminders-table-container {
  padding: 0;
}

.table-wrapper {
  border: 1px solid #c4c3c3;
  border-radius: var(--table-radius);
  overflow: hidden;
  background: #fff;
}

.rt-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  text-align: left;
  padding: var(--table-cell-padding);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #303030;
  background: #f7f7f7;
  border-bottom: 1px solid #c4c3c3;
  white-space: nowrap;
}

td {
  padding: var(--table-cell-padding);
  vertical-align: middle;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--table-border-color);
}

.rt-row {
  cursor: pointer;
  transition: all 0.2s ease;
}

.rt-row:hover {
  background-color: var(--table-row-hover);
}

.row-overdue {
  background-color: #fff5f5;
}

.row-today {
  background-color: #fffdf5;
}

.row-done {
  opacity: 0.55;
  background-color: #f8fafc;
}

.address-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.address-cell strong {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}

.address-cell span {
  color: #94a3b8;
}

.owner-name,
.agent-name {
  display: block;
  font-size: 0.8rem;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.date-block {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 10px;
  min-width: 90px;
}

.date-block strong {
  font-size: 0.82rem;
  font-weight: 700;
}

.date-block span {
  font-size: 0.7rem;
  font-weight: 600;
}

/* Rouge = dépassé */
.date-block.overdue {
  background: #fef2f2;
}

.date-block.overdue strong,
.date-block.overdue span {
  color: #dc2626;
}

/* Orange = moins de 4 jours */
.date-block.warning {
  background: #fff7ed;
}

.date-block.warning strong,
.date-block.warning span {
  color: #ea580c;
}

/* Vert = OK */
.date-block.ok {
  background: #f0fdf4;
}

.date-block.ok strong,
.date-block.ok span {
  color: #16a34a;
}

/* Gris = terminé */
.date-block.done {
  background: #f1f5f9;
}

.date-block.done strong,
.date-block.done span {
  color: #94a3b8;
}

.label-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.label-cell p {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.35;
}

.label-cell strong.done {
  text-decoration: line-through;
  color: #94a3b8;
}

.label-cell p {
  margin: 0;
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.label-cell p.done {
  text-decoration: line-through;
  color: #94a3b8;
}

.type-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.type--rappel {
  background: #eff6ff;
  color: #3b82f6;
}

.type--estimation {
  background: #ecfdf5;
  color: #059669;
}

.type--visite {
  background: #fffbeb;
  color: #d97706;
}

.type--autre {
  background: #f1f5f9;
  color: #64748b;
}

.muted {
  color: #d1d5db;
}

.center {
  text-align: center;
}

.actions-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.actions-trigger:hover {
  background: #f1f5f9;
  color: #475569;
}

.rt-empty {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .table-wrapper {
    overflow-x: auto;
  }

  .rt-table {
    min-width: 1100px;
  }
}

.actions-cell {
  width: 130px;
  text-align: center;
}

.actions-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.actions-wrapper .el-button {
  margin: 0;
}

.th-filter {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-icon {
  cursor: pointer;
  font-size: 14px;
  color: #909399;
  transition: color 0.2s;
}

.filter-icon:hover,
.filter-icon.active {
  color: #409eff;
}

.agent-filter-panel {
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow-y: auto;
}

.agent-filter-panel .el-checkbox {
  margin-bottom: 4px;
}
</style>
