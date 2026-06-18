<template>
  <div class="reminder-calendar-wrapper">
    <!-- Toolbar -->
    <div class="calendar-toolbar">
      <div class="toolbar-left">
        <el-button-group class="view-buttons">
          <el-button
            v-for="v in calendarViews"
            :key="v.value"
            :type="currentView === v.value ? 'primary' : 'default'"
            size="small"
            @click="switchView(v.value)"
          >
            <el-icon class="btn-icon"><component :is="v.icon" /></el-icon>
            {{ v.label }}
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-center">
        <el-button circle size="small" @click="navigate('prev')">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="calendar-title">{{ calendarTitle }}</span>
        <el-button circle size="small" @click="navigate('next')">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button size="small" @click="navigate('today')" class="today-btn">
          Aujourd'hui
        </el-button>
      </div>

      <div class="toolbar-right">
        <el-date-picker
          v-model="pickedDate"
          type="date"
          placeholder="Aller à une date"
          format="DD/MM/YYYY"
          size="small"
          class="date-picker"
          @change="goToDate"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="calendar-legend">
      <span class="legend-item legend-high"> <span class="legend-dot"></span>Haute priorité </span>
      <span class="legend-item legend-medium">
        <span class="legend-dot"></span>Moyenne priorité
      </span>
      <span class="legend-item legend-low"> <span class="legend-dot"></span>Basse priorité </span>
      <span class="legend-item legend-completed"> <span class="legend-dot"></span>Terminé </span>
    </div>

    <!-- FullCalendar -->
    <div class="calendar-container">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import type { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import { ArrowLeft, ArrowRight, Calendar, List, Clock } from '@element-plus/icons-vue';
import type { Reminder } from '@/stores/reminders';

const props = defineProps<{
  reminders: Reminder[];
}>();

const emit = defineEmits<{
  'edit-reminder': [reminder: Reminder];
}>();

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const pickedDate = ref<Date | null>(null);
const currentView = ref('dayGridMonth');
const calendarTitle = ref('');

const calendarViews = [
  { value: 'dayGridMonth', label: 'Mois', icon: Calendar },
  { value: 'timeGridWeek', label: 'Semaine', icon: List },
  { value: 'timeGridDay', label: 'Jour', icon: Clock },
];

const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
  high: { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' },
  medium: { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' },
  low: { bg: '#f0fdf4', border: '#22c55e', text: '#059669' },
};

const calendarEvents = computed((): EventInput[] =>
  props.reminders.map((r) => {
    const isCompleted =
      r.completed === true || (r.completed as unknown) === 1 || (r.completed as unknown) === '1';

    const colors = isCompleted
      ? { bg: '#f8fafc', border: '#94a3b8', text: '#64748b' }
      : (priorityColors[r.priority] ?? priorityColors.low);

    return {
      id: String(r.id),
      title: r.title,
      start: r.date,
      allDay: true,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: { reminder: r, isCompleted },
    };
  })
);

const calendarOptions = computed(
  (): CalendarOptions => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    locale: frLocale,
    initialView: 'dayGridMonth',
    headerToolbar: false,
    events: calendarEvents.value,
    height: '100%',
    expandRows: true,
    eventClick: handleEventClick,
    datesSet: (info) => {
      calendarTitle.value = info.view.title;
    },
    eventContent: renderEventContent,
    dayMaxEvents: 3,
    moreLinkText: (n: number) => `+${n} de plus`,
    nowIndicator: true,
    firstDay: 1,
    scrollTime: '08:00:00',
    stickyHeaderDates: true,
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    slotDuration: '00:30:00',
    allDaySlot: true,
  })
);

function renderEventContent(eventInfo: any) {
  const isCompleted = eventInfo.event.extendedProps?.isCompleted;
  return {
    html: `<div class="fc-event-inner ${isCompleted ? 'fc-event-completed' : ''}">
      <span class="fc-event-dot" style="background:${eventInfo.event.borderColor}"></span>
      <span class="fc-event-label">${eventInfo.event.title}</span>
    </div>`,
  };
}

function handleEventClick(info: EventClickArg) {
  const reminder: Reminder = info.event.extendedProps?.reminder;
  if (reminder) emit('edit-reminder', reminder);
}

function switchView(view: string) {
  currentView.value = view;
  calendarRef.value?.getApi().changeView(view);
  calendarTitle.value = calendarRef.value?.getApi().view.title ?? '';
}

function navigate(dir: 'prev' | 'next' | 'today') {
  const api = calendarRef.value?.getApi();
  if (!api) return;
  if (dir === 'prev') api.prev();
  else if (dir === 'next') api.next();
  else api.today();
  calendarTitle.value = api.view.title;
}

function goToDate(date: Date | null) {
  if (!date) return;
  calendarRef.value?.getApi().gotoDate(date);
  calendarTitle.value = calendarRef.value?.getApi().view.title ?? '';
}

watch(calendarEvents, () => calendarRef.value?.getApi().refetchEvents(), { deep: true });
</script>

<style scoped>
/*
  Layout strategy:
  - .reminder-calendar-wrapper is a flex column
  - .calendar-container takes a fixed calc() height based on viewport
  - FullCalendar fills the container via height:'100%' option
  - For month view: expandRows fills each row
  - For week/day: timeGrid naturally scrolls within the fixed container
  
  Offset breakdown (approximate):
    HeadBar          ~60px
    ElMain padding   ~32px
    Page header card ~120px
    margin-bottom    ~20px
    toolbar          ~52px
    legend           ~34px
    gaps (3×12px)    ~36px
    safety margin    ~26px
    ─────────────────────
    Total            ~380px
*/

/* ── Wrapper ─────────────────────────────── */
.reminder-calendar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Toolbar ─────────────────────────────── */
.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: var(--apple-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: 12px 20px;
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--page-title-color);
  min-width: 190px;
  text-align: center;
  letter-spacing: -0.01em;
}

.view-buttons :deep(.el-button) {
  border-radius: var(--btn-radius) !important;
  font-weight: 500;
  font-size: 0.8rem;
}

.btn-icon {
  margin-right: 4px;
}

.today-btn {
  border-radius: var(--btn-radius);
  font-weight: 500;
  margin-left: 4px;
}

.date-picker {
  width: 170px;
}

/* ── Legend ─────────────────────────────── */
.calendar-legend {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 2px 2px;
  flex-shrink: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.legend-high .legend-dot   { background: #ef4444; }
.legend-medium .legend-dot { background: #f59e0b; }
.legend-low .legend-dot    { background: #22c55e; }
.legend-completed .legend-dot { background: #94a3b8; }

/* ── Calendar container ──────────────────── */
.calendar-container {
  background: var(--apple-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: 16px;
  overflow: hidden;

  /* Fill remaining viewport height */
  height: calc(100vh - 380px);
  min-height: 500px;

  /* Make FullCalendar fill this box */
  display: flex;
  flex-direction: column;
}

/* ── FullCalendar root must fill container ── */
.calendar-container :deep(.fc) {
  font-family: inherit;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* View harness grows to fill .fc */
.calendar-container :deep(.fc-view-harness) {
  flex: 1 !important;
  height: 0 !important; /* flex trick */
  overflow: hidden;
}

/* scrollable content inside timegrid */
.calendar-container :deep(.fc-timegrid-body),
.calendar-container :deep(.fc-scroller) {
  height: 100% !important;
  overflow-y: auto !important;
}

/* ── Grid & borders ──────────────────────── */
.calendar-container :deep(.fc-theme-standard td),
.calendar-container :deep(.fc-theme-standard th) {
  border-color: rgba(229, 231, 235, 0.7);
}

/* ── Day headers ─────────────────────────── */
.calendar-container :deep(.fc-col-header-cell-cushion) {
  font-weight: 600;
  color: var(--apple-text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 4px;
  text-decoration: none !important;
}

.calendar-container :deep(.fc-col-header) {
  background: rgba(248, 250, 252, 0.8);
  border-bottom: 1px solid rgba(229, 231, 235, 0.8);
}

/* ── Day numbers ─────────────────────────── */
.calendar-container :deep(.fc-daygrid-day-number) {
  font-size: 0.82rem;
  font-weight: 500;
  color: #374151;
  padding: 5px 8px;
  border-radius: 6px;
  transition: background 0.15s;
  text-decoration: none !important;
}

.calendar-container :deep(.fc-day-today .fc-daygrid-day-number) {
  background: var(--blue);
  color: white;
  font-weight: 700;
}

.calendar-container :deep(.fc-day-today) {
  background: rgba(0, 122, 255, 0.035) !important;
}

.calendar-container :deep(.fc-daygrid-day:hover) {
  background: rgba(0, 0, 0, 0.018);
}

/* ── Events ──────────────────────────────── */
.calendar-container :deep(.fc-event) {
  border-radius: 6px;
  border-width: 1.5px;
  cursor: pointer;
  padding: 1px 4px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  margin-bottom: 2px;
}

.calendar-container :deep(.fc-event:hover) {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.13);
}

.calendar-container :deep(.fc-event-main) {
  overflow: hidden;
}

/* ── "+N more" link ──────────────────────── */
.calendar-container :deep(.fc-more-link) {
  font-size: 0.72rem;
  color: var(--blue);
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(0, 122, 255, 0.07);
}

.calendar-container :deep(.fc-more-link:hover) {
  background: rgba(0, 122, 255, 0.13);
}

/* ── Time grid ───────────────────────────── */
.calendar-container :deep(.fc-timegrid-slot) {
  height: 44px;
  border-color: rgba(229, 231, 235, 0.5);
}

.calendar-container :deep(.fc-timegrid-slot-minor) {
  border-top-style: dotted;
  border-color: rgba(229, 231, 235, 0.35);
}

.calendar-container :deep(.fc-timegrid-axis-cushion),
.calendar-container :deep(.fc-timegrid-slot-label-cushion) {
  font-size: 0.72rem;
  color: var(--apple-text-secondary);
  font-weight: 500;
}

/* ── Now indicator ───────────────────────── */
.calendar-container :deep(.fc-now-indicator-line) {
  border-color: var(--blue);
  border-width: 2px;
}

.calendar-container :deep(.fc-now-indicator-arrow) {
  border-top-color: var(--blue);
  border-bottom-color: var(--blue);
}

/* ── Sticky header (week/day) ────────────── */
.calendar-container :deep(.fc-col-header-cell) {
  position: sticky;
  top: 0;
  z-index: 4;
  background: rgba(248, 250, 252, 0.95);
  backdrop-filter: blur(8px);
}

/* ── All-day row ─────────────────────────── */
.calendar-container :deep(.fc-daygrid-day-bg) {
  border-radius: 0;
}

/* ── Daygrid row heights (expandRows) ────── */
.calendar-container :deep(.fc-daygrid-body) {
  height: 100% !important;
}

.calendar-container :deep(.fc-daygrid-body table) {
  height: 100% !important;
}

/* ── Event inner content ─────────────────── */
:deep(.fc-event-inner) {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
}

:deep(.fc-event-dot) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

:deep(.fc-event-label) {
  font-size: 0.78rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.fc-event-completed .fc-event-label) {
  text-decoration: line-through;
  opacity: 0.65;
}

/* ── Popover (overflow) ──────────────────── */
.calendar-container :deep(.fc-popover) {
  border-radius: var(--card-radius);
  border: var(--card-border);
  box-shadow: var(--card-shadow-hover);
  font-family: inherit;
}

.calendar-container :deep(.fc-popover-header) {
  background: rgba(248, 250, 252, 0.95);
  border-radius: var(--card-radius) var(--card-radius) 0 0;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--page-title-color);
}

/* ── Responsive ──────────────────────────── */
@media (max-width: 900px) {
  .calendar-container {
    height: calc(100vh - 420px);
  }
}

@media (max-width: 768px) {
  .calendar-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px;
  }

  .toolbar-center {
    justify-content: center;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }

  .calendar-title {
    min-width: 120px;
    font-size: 0.875rem;
  }

  .date-picker {
    width: 100%;
  }

  .calendar-legend {
    gap: 12px;
  }

  .calendar-container {
    height: calc(100vh - 480px);
    min-height: 420px;
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .calendar-container {
    height: calc(100vh - 520px);
    min-height: 380px;
  }
}
</style>
