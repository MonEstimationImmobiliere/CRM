<template>
  <div class="reminders-table-container">
    <div class="table-wrapper">
      <table class="rt-table">
        <thead>
          <tr>
            <th class="rt-th rt-th--priority" style="width: 4px"></th>
            <th class="rt-th" style="width: 200px">Rappel</th>
            <th class="rt-th" style="width: 110px">Type</th>
            <th class="rt-th" style="width: 150px">Échéance</th>
            <th class="rt-th" style="width: 100px">Statut</th>
            <th class="rt-th rt-th--progress" style="width: 220px">
              Avancement
            </th>
            <th class="rt-th" style="width: 50px"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="reminder in reminders"
            :key="reminder.id"
            class="rt-row"
            :class="getRowClass(reminder)"
          >
            <!-- Priority strip -->
            <td class="rt-cell rt-cell--strip">
              <div
                class="priority-strip"
                :class="'strip--' + reminder.priority"
              ></div>
            </td>

            <!-- Title + description + priority badge -->
            <td class="rt-cell rt-cell--main">
              <div class="main-cell">
                <div class="main-cell__top">
                  <span
                    class="rt-title"
                    :class="{ 'rt-title--done': reminder.completed }"
                  >
                    {{ reminder.title }}
                  </span>
                  <span
                    class="priority-dot"
                    :class="'dot--' + reminder.priority"
                    :title="getPriorityLabel(reminder.priority)"
                  ></span>
                </div>
                <span v-if="reminder.description" class="rt-desc">
                  {{ reminder.description }}
                </span>
              </div>
            </td>

            <!-- Type -->
            <td class="rt-cell">
              <span
                v-if="reminder.type"
                class="rt-type-badge"
                :class="'type--' + reminder.type"
              >
                {{ getTypeLabel(reminder.type) }}
              </span>
              <span v-else class="rt-muted">—</span>
            </td>

            <!-- Date + countdown -->
            <td class="rt-cell">
              <div class="date-block" :class="getDateBlockClass(reminder)">
                <span class="date-block__date">
                  {{ formatShortDate(reminder.date) }}
                </span>
                <span class="date-block__countdown">
                  {{ getDaysLeftText(reminder) }}
                </span>
              </div>
            </td>

            <!-- Status pill -->
            <td class="rt-cell">
              <span class="status-pill" :class="'pill--' + getStatus(reminder)">
                <span class="status-pill__dot"></span>
                {{ getStatusLabel(getStatus(reminder)) }}
              </span>
            </td>

            <!-- Progress buttons -->
            <td class="rt-cell rt-cell--progress">
              <div class="progress-track">
                <button
                  class="progress-step"
                  :class="{
                    'step--active': getStatus(reminder) === 'todo',
                    'step--done':
                      getStatus(reminder) === 'progress' ||
                      getStatus(reminder) === 'completed',
                  }"
                  title="À faire"
                  @click.stop="$emit('update-status', reminder, 'todo')"
                >
                  <span class="step-dot"></span>
                  <span class="step-label">À faire</span>
                </button>
                <div
                  class="progress-line"
                  :class="{
                    'line--filled':
                      getStatus(reminder) === 'progress' ||
                      getStatus(reminder) === 'completed',
                  }"
                ></div>
                <button
                  class="progress-step"
                  :class="{
                    'step--active': getStatus(reminder) === 'progress',
                    'step--done': getStatus(reminder) === 'completed',
                  }"
                  title="En cours"
                  @click.stop="$emit('update-status', reminder, 'progress')"
                >
                  <span class="step-dot"></span>
                  <span class="step-label">En cours</span>
                </button>
                <div
                  class="progress-line"
                  :class="{
                    'line--filled': getStatus(reminder) === 'completed',
                  }"
                ></div>
                <button
                  class="progress-step"
                  :class="{
                    'step--active': getStatus(reminder) === 'completed',
                  }"
                  title="Terminé"
                  @click.stop="$emit('update-status', reminder, 'completed')"
                >
                  <span class="step-dot"></span>
                  <span class="step-label">Terminé</span>
                </button>
              </div>
            </td>

            <!-- Actions dropdown -->
            <td class="rt-cell rt-cell--actions">
              <el-dropdown
                trigger="click"
                placement="bottom-end"
                @command="
                  (cmd: string) =>
                    $emit('action', { action: cmd, reminder: reminder })
                "
              >
                <button
                  class="actions-trigger"
                  aria-label="Actions"
                  @click.stop
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="3" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="13" r="1.5" fill="currentColor" />
                  </svg>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit" :icon="Edit">
                      Modifier
                    </el-dropdown-item>
                    <el-dropdown-item command="duplicate" :icon="DocumentCopy">
                      Dupliquer
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" :icon="Delete" divided>
                      Supprimer
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="reminders.length === 0" class="rt-empty">
        Aucun rappel trouvé
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Delete, DocumentCopy } from '@element-plus/icons-vue';
import type { Reminder } from '@/stores/reminders';
import {
  getPriorityLabel,
  getTypeLabel,
  isOverdue,
  isToday,
} from '@/utils/reminderHelpers';

interface ActionCommand {
  action: string;
  reminder: Reminder;
}

defineProps<{
  reminders: Reminder[];
}>();

defineEmits<{
  action: [command: ActionCommand];
  'update-status': [
    reminder: Reminder,
    status: 'todo' | 'progress' | 'completed',
  ];
}>();

/* ── Helpers ────────────────────────────────────── */

const getStatus = (r: Reminder): 'todo' | 'progress' | 'completed' => {
  if (r.status) return r.status;
  if (r.completed) return 'completed';
  return 'todo';
};

const getStatusLabel = (s: string) =>
  ({ todo: 'À faire', progress: 'En cours', completed: 'Terminé' })[s] ?? s;

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
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
};

const getDaysLeftText = (r: Reminder): string => {
  if (r.completed) return '✓ Terminé';
  const d = getDiffDays(r.date);
  if (d < 0) return `${Math.abs(d)}j de retard`;
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Demain';
  return `J-${d}`;
};

const getDateBlockClass = (r: Reminder): string => {
  if (r.completed) return 'date-block--done';
  const d = getDiffDays(r.date);
  if (d < 0) return 'date-block--overdue';
  if (d === 0) return 'date-block--today';
  if (d <= 3) return 'date-block--soon';
  return '';
};

const getRowClass = (r: Reminder): string => {
  if (isOverdue(r.date, r.completed)) return 'rt-row--overdue';
  if (isToday(r.date) && !r.completed) return 'rt-row--today';
  if (r.completed) return 'rt-row--done';
  return '';
};
</script>

<style scoped>
/* ── Container ───────────────────────────────── */
.reminders-table-container {
  padding: 0;
}

.table-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: var(--table-radius);
  overflow: hidden;
  background: #fff;
  box-shadow: var(--table-shadow);
}

/* ── Table base ──────────────────────────────── */
.rt-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* ── Header ──────────────────────────────────── */
.rt-th {
  text-align: left;
  padding: 12px 14px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
  background: #fafbfc;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
  user-select: none;
}

.rt-th--priority {
  padding: 0;
}

.rt-th--progress {
  text-align: center;
}

/* ── Rows ────────────────────────────────────── */
.rt-row {
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #f1f5f9;
}

.rt-row:last-child {
  border-bottom: none;
}

.rt-row:hover {
  background-color: #f8faff;
}

.rt-row--overdue {
  background-color: #fff5f5;
}

.rt-row--overdue:hover {
  background-color: #fff0f0;
}

.rt-row--today {
  background-color: #fffdf5;
}

.rt-row--today:hover {
  background-color: #fffceb;
}

.rt-row--done {
  opacity: 0.55;
}

.rt-row--done:hover {
  opacity: 0.75;
}

/* ── Cells ───────────────────────────────────── */
.rt-cell {
  padding: 14px 14px;
  vertical-align: middle;
  font-size: 0.875rem;
}

.rt-cell--strip {
  padding: 0;
  width: 4px;
}

.rt-cell--actions {
  padding: 14px 8px;
  text-align: center;
}

.rt-cell--progress {
  padding: 14px 10px;
}

/* ── Priority strip ──────────────────────────── */
.priority-strip {
  width: 4px;
  height: 100%;
  min-height: 52px;
  border-radius: 0 4px 4px 0;
}

.strip--high {
  background: #ef4444;
}

.strip--medium {
  background: #f59e0b;
}

.strip--low {
  background: #22c55e;
}

/* ── Main cell (title) ───────────────────────── */
.main-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.main-cell__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rt-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rt-title--done {
  text-decoration: line-through;
  color: #94a3b8;
}

.priority-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot--high {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.dot--medium {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}

.dot--low {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

.rt-desc {
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}

/* ── Type badge ──────────────────────────────── */
.rt-type-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.02em;
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

.rt-muted {
  color: #d1d5db;
}

/* ── Date block ──────────────────────────────── */
.date-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-block__date {
  font-weight: 600;
  font-size: 0.8rem;
  color: #334155;
}

.date-block__countdown {
  font-size: 0.7rem;
  font-weight: 500;
  color: #94a3b8;
}

.date-block--overdue .date-block__date {
  color: #dc2626;
}

.date-block--overdue .date-block__countdown {
  color: #ef4444;
  font-weight: 700;
}

.date-block--today .date-block__date {
  color: #d97706;
}

.date-block--today .date-block__countdown {
  color: #f59e0b;
  font-weight: 700;
}

.date-block--soon .date-block__countdown {
  color: #3b82f6;
}

.date-block--done .date-block__date {
  color: #94a3b8;
}

.date-block--done .date-block__countdown {
  color: #22c55e;
}

/* ── Status pill ─────────────────────────────── */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.status-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pill--todo {
  background: #eff6ff;
  color: #3b82f6;
}

.pill--todo .status-pill__dot {
  background: #3b82f6;
}

.pill--progress {
  background: #fffbeb;
  color: #d97706;
}

.pill--progress .status-pill__dot {
  background: #f59e0b;
  animation: pulse-dot 2s infinite;
}

.pill--completed {
  background: #ecfdf5;
  color: #059669;
}

.pill--completed .status-pill__dot {
  background: #22c55e;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* ── Progress track (stepper) ────────────────── */
.progress-track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.15s;
}

.progress-step:hover {
  background: #f1f5f9;
}

.step-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  background: #fff;
  transition: all 0.2s;
}

.step-label {
  font-size: 0.6rem;
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
}

.progress-line {
  width: 20px;
  height: 2px;
  background: #e2e8f0;
  flex-shrink: 0;
  transition: background 0.2s;
  margin-bottom: 14px;
}

.line--filled {
  background: #22c55e;
}

.step--active .step-dot {
  border-color: #3b82f6;
  background: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.step--active .step-label {
  color: #3b82f6;
  font-weight: 700;
}

.step--done .step-dot {
  border-color: #22c55e;
  background: #22c55e;
}

.step--done .step-label {
  color: #22c55e;
}

/* ── Actions trigger ─────────────────────────── */
.actions-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}

.actions-trigger:hover {
  background: #f1f5f9;
  color: #475569;
}

/* ── Empty ───────────────────────────────────── */
.rt-empty {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* ── Responsive ──────────────────────────────── */
@media (max-width: 900px) {
  .rt-th--progress,
  .rt-cell--progress {
    display: none;
  }
}

@media (max-width: 640px) {
  .rt-cell {
    padding: 10px 8px;
  }

  .rt-title {
    font-size: 0.8rem;
  }

  .rt-desc {
    display: none;
  }
}
</style>
