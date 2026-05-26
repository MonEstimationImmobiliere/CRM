label_cell<template>
  <div class="reminders-table-container">
    <div class="table-wrapper">
      <table class="rt-table">
        <thead>
          <tr>
            <th style="width: 260px">Adresse du bien</th>
            <th style="width: 160px">Propriétaire</th>
            <th style="width: 130px">Échéance</th>
            <th style="width: 120px">Type</th>
            <th>Libellé</th>
            <th style="width: 150px">Agent</th>
            <th style="width: 80px">Fait</th>
            <th style="width: 90px">Partage</th>
            <th style="width: 190px"></th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="reminder in reminders"
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
      <strong>{{ getBasePropertyAddress(reminder.property) }}</strong>

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
            <p :class="{ done: reminder.completed }">
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
                :model-value="!!reminder.completed"
                @update:model-value="
                  val =>
                    $emit(
                      'update-status',
                      reminder,
                      val ? 'completed' : 'todo'
                    )
                "
              />
            </td>

            <td class="center" @click.stop>
              <EMToggleSwitch
                :model-value="!!reminder.sharing"
                @update:model-value="val => $emit('update-sharing', reminder, val)"
              />
            </td>

<td class="actions-cell" @click.stop>
  <div class="actions-wrapper">
<el-button
  size="small"
  type="primary"
  circle
  :disabled="!reminder.property_id"
  @click="$emit('action', { action: 'open-property', reminder })"
>
  <el-icon><Edit /></el-icon>
</el-button>

<el-button
  size="small"
  plain
  circle
  @click="$emit('action', { action: 'edit', reminder })"
>
  <el-icon><EditPen /></el-icon>
</el-button>

<el-button
  size="small"
  type="success"
  circle
  :disabled="!reminder.property_id"
  @click="$emit('action', { action: 'new-reminder', reminder })"
>
  <el-icon><Plus /></el-icon>
</el-button>
  </div>
</td>


          </tr>
        </tbody>
      </table>

      <div v-if="reminders.length === 0" class="rt-empty">
        Aucun rappel trouvé
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Delete, DocumentCopy } from '@element-plus/icons-vue';
import type { Reminder } from '@/stores/reminders';
import type { IReminderProperty } from '@/types/reminder';
import EMToggleSwitch from '@/components/OwnReusableComponents/switch/EMToggleSwitch.vue';
import { getTypeLabel, isOverdue, isToday } from '@/utils/reminderHelpers';
import { EditPen, Plus } from '@element-plus/icons-vue';

interface ActionCommand {
  action: string;
  reminder: Reminder;
}

defineProps<{
  reminders: Reminder[];
  userRole: string;
}>();

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

  const cityLine = `${property.code_postal ?? ''} ${property.city ?? ''}`.trim();
  if (cityLine) parts.push(cityLine);

  return parts.join(' ');
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
  if (r.completed) return 'Terminé';

  const d = getDiffDays(r.date);

  if (d < 0) return `${Math.abs(d)}j de retard`;
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Demain';

  return `J-${d}`;
};

const getDateBlockClass = (r: Reminder): string => {
  if (r.completed) return 'done';

  const d = getDiffDays(r.date);

  if (d < 0) return 'overdue';

  if (d <= 3) return 'warning';

  return 'ok';
};

const getRowClass = (r: Reminder): string => {
  if (r.completed) return 'row-done';
  if (isOverdue(r.date, r.completed)) return 'row-overdue';
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


</style>