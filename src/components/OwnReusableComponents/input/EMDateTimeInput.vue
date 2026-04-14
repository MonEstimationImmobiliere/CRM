<template>
  <div class="em-datetime-input" :class="{ disabled }">
    <label v-if="label" class="datetime-label">{{ label }}</label>

    <!-- Selected date entries -->
    <div class="datetime-entries">
      <div
        v-for="(entry, index) in entriesArray"
        :key="entry.id"
        class="date-entry-card"
        :class="{ clickable: !disabled }"
        @click="!disabled && editEntry(index)"
      >
        <div class="date-entry-day">{{ getDayNumber(entry.date) }}</div>
        <div class="date-entry-info">
          <span class="date-entry-month">{{ getMonthYear(entry.date) }}</span>
          <span
            v-if="timeMode === 'range' && entry.startTime && entry.endTime"
            class="date-entry-time"
          >
            {{ entry.startTime }} - {{ entry.endTime }}
          </span>
          <span v-else-if="timeMode === 'single' && entry.time" class="date-entry-time">
            {{ entry.time }}
          </span>
        </div>
        <button
          v-if="!disabled && multiple"
          class="date-entry-remove"
          type="button"
          @click.stop="removeEntry(index)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Add date button (dashed) — shown when multiple, or when single and no value yet -->
      <button
        v-if="!disabled && (multiple || entriesArray.length === 0)"
        type="button"
        class="add-date-btn"
        @click="openModal()"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>{{ placeholder }}</span>
      </button>
    </div>

    <span v-if="errorText" class="datetime-error">{{ errorText }}</span>

    <!-- Modal -->
    <IonModal :is-open="isModalOpen" class="datetime-modal" @didDismiss="closeModal">
      <div class="modal-content">
        <!-- Header -->
        <div class="modal-header">
          <h3 class="modal-title">
            {{ editingIndex !== null ? 'Modifier la date' : 'Ajouter une date' }}
          </h3>
          <button type="button" class="modal-close-btn" @click="closeModal">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Calendar -->
        <div class="calendar">
          <div class="calendar-nav">
            <button type="button" class="calendar-nav-btn" @click="prevMonth">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span class="calendar-month-label">{{ currentMonthLabel }}</span>
            <button type="button" class="calendar-nav-btn" @click="nextMonth">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <div class="calendar-weekdays">
            <span v-for="day in weekDays" :key="day" class="calendar-weekday">{{ day }}</span>
          </div>
          <div class="calendar-grid">
            <span
              v-for="(cell, idx) in calendarCells"
              :key="idx"
              class="calendar-cell"
              :class="{
                empty: !cell,
                today: cell && isToday(cell),
                selected: cell && isSelectedDay(cell),
                'other-month': false,
                disabled: cell && isDayDisabled(cell),
              }"
              @click="cell && !isDayDisabled(cell) && selectDay(cell)"
            >
              {{ cell || '' }}
            </span>
          </div>
        </div>

        <!-- Selected date display -->
        <div v-if="selectedDate" class="selected-date-label">
          {{ formatFullDate(selectedDate) }}
        </div>

        <!-- Time selectors -->
        <div v-if="timeMode !== 'none' && selectedDate" class="time-selectors">
          <!-- Range mode: Ouverture + Fermeture -->
          <template v-if="timeMode === 'range'">
            <div class="time-field">
              <label class="time-label">Ouverture <span class="required">*</span></label>
              <div class="time-select-wrapper" ref="startTimeRef">
                <button
                  type="button"
                  class="time-select-btn"
                  :class="{ open: isStartTimeOpen }"
                  @click="toggleStartTime"
                >
                  <span>{{ modalStartTime }}</span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <div v-show="isStartTimeOpen" class="time-dropdown">
                  <div
                    v-for="t in timeOptions"
                    :key="'start-' + t"
                    class="time-option"
                    :class="{ selected: t === modalStartTime }"
                    @click="selectStartTime(t)"
                  >
                    {{ t }}
                  </div>
                </div>
              </div>
            </div>
            <div class="time-field">
              <label class="time-label">Fermeture <span class="required">*</span></label>
              <div class="time-select-wrapper" ref="endTimeRef">
                <button
                  type="button"
                  class="time-select-btn"
                  :class="{ open: isEndTimeOpen }"
                  @click="toggleEndTime"
                >
                  <span>{{ modalEndTime }}</span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <div v-show="isEndTimeOpen" class="time-dropdown">
                  <div
                    v-for="t in timeOptions"
                    :key="'end-' + t"
                    class="time-option"
                    :class="{ selected: t === modalEndTime }"
                    @click="selectEndTime(t)"
                  >
                    {{ t }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Single time mode -->
          <template v-if="timeMode === 'single'">
            <div class="time-field time-field--full">
              <label class="time-label">Heure <span class="required">*</span></label>
              <div class="time-select-wrapper" ref="singleTimeRef">
                <button
                  type="button"
                  class="time-select-btn"
                  :class="{ open: isSingleTimeOpen }"
                  @click="toggleSingleTime"
                >
                  <span>{{ modalSingleTime }}</span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <div v-show="isSingleTimeOpen" class="time-dropdown">
                  <div
                    v-for="t in timeOptions"
                    :key="'single-' + t"
                    class="time-option"
                    :class="{ selected: t === modalSingleTime }"
                    @click="selectSingleTime(t)"
                  >
                    {{ t }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer buttons -->
        <div class="modal-footer">
          <Button @click="closeModal"> Annuler </Button>
          <Button type="primary" :disabled="!canAdd" @click="confirmEntry">
            {{ editingIndex !== null ? 'Modifier' : 'Ajouter' }}
          </Button>
        </div>
      </div>
    </IonModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { IonModal } from '@ionic/vue';
import { useLocale } from '@/common/composables/useLocale';
import Button from '../button/Button.vue';

/**
 * Internal representation of a date+time entry.
 * Not exposed to consumers — the component accepts/emits ISO strings.
 */
interface DateTimeEntry {
  id: string;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Start time HH:mm (range mode) */
  startTime?: string;
  /** End time HH:mm (range mode) */
  endTime?: string;
  /** Single time HH:mm (single mode) */
  time?: string;
}

interface Props {
  /**
   * v-model value.
   * - When multiple=true: string[] (array of ISO date strings)
   * - When multiple=false: string (single ISO date string) or null
   */
  modelValue: string | string[] | null;
  /** Label displayed above the component */
  label?: string;
  /**
   * Time mode:
   *  - 'range': shows Ouverture + Fermeture time pickers
   *  - 'single': shows a single time picker
   *  - 'none': no time picker, date only
   */
  timeMode?: 'range' | 'single' | 'none';
  /** Allow multiple date entries. When false, only one entry at a time. */
  multiple?: boolean;
  /** Default start time for range mode */
  defaultStartTime?: string;
  /** Default end time for range mode */
  defaultEndTime?: string;
  /** Default time for single mode */
  defaultTime?: string;
  /** Time interval in minutes for the time dropdown */
  timeStep?: number;
  /** Disable the component */
  disabled?: boolean;
  /** Minimum selectable date (ISO string, e.g. '2025-03-01'). Days before this date are disabled. */
  minDate?: string;
  /** Error text shown below the component */
  errorText?: string;
  /** Placeholder text for the add button */
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  timeMode: 'range',
  multiple: true,
  defaultStartTime: '09:00',
  defaultEndTime: '19:00',
  defaultTime: '09:00',
  timeStep: 5,
  disabled: false,
  placeholder: 'Ajouter une date',
});

const { currentLocale } = useLocale();

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | null];
  change: [value: string | string[] | null];
}>();

/** Parse an ISO string into an internal DateTimeEntry */
function isoToEntry(iso: string): DateTimeEntry | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const dateStr = d.toISOString().split('T')[0];
  const hours = d.getUTCHours().toString().padStart(2, '0');
  const minutes = d.getUTCMinutes().toString().padStart(2, '0');
  return {
    id: iso,
    date: dateStr,
    time: `${hours}:${minutes}`,
    startTime: `${hours}:${minutes}`,
    endTime: `${hours}:${minutes}`,
  };
}

/** Convert an internal DateTimeEntry back to an ISO string */
function entryToIso(entry: DateTimeEntry): string {
  const timePart =
    props.timeMode === 'single'
      ? (entry.time ?? '00:00')
      : props.timeMode === 'range'
        ? (entry.startTime ?? '00:00')
        : '00:00';
  const [hours, minutes] = timePart.split(':').map(Number);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${entry.date}T${hh}:${mm}:00.000Z`;
}

/** Normalise modelValue (ISO strings) to always work with an array of DateTimeEntry internally */
const entriesArray = computed<DateTimeEntry[]>(() => {
  if (props.multiple) {
    const arr = (props.modelValue as string[]) ?? [];
    return arr.map((s) => isoToEntry(s)).filter((e): e is DateTimeEntry => e !== null);
  }
  const single = props.modelValue as string | null;
  if (!single) return [];
  const entry = isoToEntry(single);
  return entry ? [entry] : [];
});

// ── Modal state ──
const isModalOpen = ref(false);
const editingIndex = ref<number | null>(null);

// ── Calendar state ──
const today = new Date();
const viewYear = ref(today.getFullYear());
const viewMonth = ref(today.getMonth()); // 0-indexed
const selectedDate = ref<string | null>(null);

// ── Time state (modal local) ──
const modalStartTime = ref(props.defaultStartTime);
const modalEndTime = ref(props.defaultEndTime);
const modalSingleTime = ref(props.defaultTime);

const isStartTimeOpen = ref(false);
const isEndTimeOpen = ref(false);
const isSingleTimeOpen = ref(false);

const startTimeRef = ref<HTMLElement | null>(null);
const endTimeRef = ref<HTMLElement | null>(null);
const singleTimeRef = ref<HTMLElement | null>(null);

// ── Locale-aware helpers ──
const LOCALE_DATA = {
  fr: {
    weekDays: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    months: [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ],
    monthsShort: [
      'JANVIER',
      'FÉVRIER',
      'MARS',
      'AVRIL',
      'MAI',
      'JUIN',
      'JUILLET',
      'AOÛT',
      'SEPTEMBRE',
      'OCTOBRE',
      'NOVEMBRE',
      'DÉCEMBRE',
    ],
    days: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  },
  en: {
    weekDays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    monthsShort: [
      'JANUARY',
      'FEBRUARY',
      'MARCH',
      'APRIL',
      'MAY',
      'JUNE',
      'JULY',
      'AUGUST',
      'SEPTEMBER',
      'OCTOBER',
      'NOVEMBER',
      'DECEMBER',
    ],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
} as const;

type SupportedLocale = keyof typeof LOCALE_DATA;

const localeData = computed(() => {
  const lang = currentLocale.value?.startsWith('en') ? 'en' : 'fr';
  return LOCALE_DATA[lang as SupportedLocale] ?? LOCALE_DATA.fr;
});

const weekDays = computed(() => localeData.value.weekDays);
const MONTH_NAMES = computed(() => localeData.value.months);
const MONTH_NAMES_SHORT = computed(() => localeData.value.monthsShort);
const DAY_NAMES = computed(() => localeData.value.days);

const currentMonthLabel = computed(() => {
  return `${MONTH_NAMES.value[viewMonth.value]} ${viewYear.value}`;
});

/** Generate time options (HH:mm) in `timeStep` increments */
const timeOptions = computed<string[]>(() => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += props.timeStep) {
      options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return options;
});

/** Calendar cells: empty slots for offset + day numbers */
const calendarCells = computed<(number | null)[]>(() => {
  const year = viewYear.value;
  const month = viewMonth.value;
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert to Monday-first (0=Mon)
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
});

function isToday(day: number): boolean {
  return (
    day === today.getDate() &&
    viewMonth.value === today.getMonth() &&
    viewYear.value === today.getFullYear()
  );
}

function isSelectedDay(day: number): boolean {
  if (!selectedDate.value) return false;
  const sel = new Date(selectedDate.value);
  return (
    day === sel.getDate() &&
    viewMonth.value === sel.getMonth() &&
    viewYear.value === sel.getFullYear()
  );
}

/** Check whether a calendar day should be disabled (before minDate) */
function isDayDisabled(day: number): boolean {
  if (!props.minDate) return false;
  const cellDate = new Date(viewYear.value, viewMonth.value, day);
  const min = new Date(props.minDate);
  // Compare date-only (strip time)
  min.setHours(0, 0, 0, 0);
  cellDate.setHours(0, 0, 0, 0);
  return cellDate < min;
}

function selectDay(day: number) {
  const y = viewYear.value;
  const m = String(viewMonth.value + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  selectedDate.value = `${y}-${m}-${d}`;
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value--;
  } else {
    viewMonth.value--;
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value++;
  } else {
    viewMonth.value++;
  }
}

function getDayNumber(dateStr: string): string {
  const d = new Date(dateStr);
  return String(d.getDate());
}

function getMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTH_NAMES_SHORT.value[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dayName = DAY_NAMES.value[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTH_NAMES.value[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName} ${dayNum} ${monthName} ${year}`;
}

// ── Time dropdowns ──
function toggleStartTime() {
  isStartTimeOpen.value = !isStartTimeOpen.value;
  isEndTimeOpen.value = false;
  isSingleTimeOpen.value = false;
  if (isStartTimeOpen.value) scrollToSelected('start');
}
function toggleEndTime() {
  isEndTimeOpen.value = !isEndTimeOpen.value;
  isStartTimeOpen.value = false;
  isSingleTimeOpen.value = false;
  if (isEndTimeOpen.value) scrollToSelected('end');
}
function toggleSingleTime() {
  isSingleTimeOpen.value = !isSingleTimeOpen.value;
  isStartTimeOpen.value = false;
  isEndTimeOpen.value = false;
  if (isSingleTimeOpen.value) scrollToSelected('single');
}

function selectStartTime(t: string) {
  modalStartTime.value = t;
  isStartTimeOpen.value = false;
}
function selectEndTime(t: string) {
  modalEndTime.value = t;
  isEndTimeOpen.value = false;
}
function selectSingleTime(t: string) {
  modalSingleTime.value = t;
  isSingleTimeOpen.value = false;
}

function scrollToSelected(type: 'start' | 'end' | 'single') {
  nextTick(() => {
    const wrapper =
      type === 'start'
        ? startTimeRef.value
        : type === 'end'
          ? endTimeRef.value
          : singleTimeRef.value;
    if (!wrapper) return;
    const dropdown = wrapper.querySelector('.time-dropdown');
    const selected = dropdown?.querySelector('.time-option.selected');
    if (selected && dropdown) {
      (selected as HTMLElement).scrollIntoView({ block: 'center' });
    }
  });
}

// Close time dropdowns when clicking outside
function handleOutsideClick(e: MouseEvent) {
  const target = e.target as Node;
  if (startTimeRef.value && !startTimeRef.value.contains(target)) isStartTimeOpen.value = false;
  if (endTimeRef.value && !endTimeRef.value.contains(target)) isEndTimeOpen.value = false;
  if (singleTimeRef.value && !singleTimeRef.value.contains(target)) isSingleTimeOpen.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
});

// ── Validation ──
const canAdd = computed(() => {
  if (!selectedDate.value) return false;
  if (props.timeMode === 'range') return !!modalStartTime.value && !!modalEndTime.value;
  if (props.timeMode === 'single') return !!modalSingleTime.value;
  return true;
});

// ── Emit helper ──
function emitValue(entries: DateTimeEntry[]) {
  if (props.multiple) {
    const isoArr = entries.map(entryToIso);
    emit('update:modelValue', isoArr);
    emit('change', isoArr);
  } else {
    const val = entries.length > 0 ? entryToIso(entries[0]) : null;
    emit('update:modelValue', val);
    emit('change', val);
  }
}

// ── Modal actions ──
function openModal(prefillIndex?: number) {
  editingIndex.value = prefillIndex ?? null;
  isStartTimeOpen.value = false;
  isEndTimeOpen.value = false;
  isSingleTimeOpen.value = false;

  if (prefillIndex !== null && prefillIndex !== undefined && entriesArray.value[prefillIndex]) {
    // Edit mode — prefill with existing entry data
    const entry = entriesArray.value[prefillIndex];
    selectedDate.value = entry.date;
    modalStartTime.value = entry.startTime ?? props.defaultStartTime;
    modalEndTime.value = entry.endTime ?? props.defaultEndTime;
    modalSingleTime.value = entry.time ?? props.defaultTime;

    const d = new Date(entry.date);
    viewYear.value = d.getFullYear();
    viewMonth.value = d.getMonth();
  } else {
    // Add mode — reset
    selectedDate.value = null;
    modalStartTime.value = props.defaultStartTime;
    modalEndTime.value = props.defaultEndTime;
    modalSingleTime.value = props.defaultTime;

    const now = new Date();
    viewYear.value = now.getFullYear();
    viewMonth.value = now.getMonth();
  }

  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingIndex.value = null;
}

function editEntry(index: number) {
  openModal(index);
}

function confirmEntry() {
  if (!selectedDate.value || !canAdd.value) return;

  const entry: DateTimeEntry = {
    id:
      editingIndex.value !== null && entriesArray.value[editingIndex.value]
        ? entriesArray.value[editingIndex.value].id
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    date: selectedDate.value,
  };

  if (props.timeMode === 'range') {
    entry.startTime = modalStartTime.value;
    entry.endTime = modalEndTime.value;
  } else if (props.timeMode === 'single') {
    entry.time = modalSingleTime.value;
  }

  let updated: DateTimeEntry[];

  if (editingIndex.value !== null) {
    // Edit existing
    updated = entriesArray.value.map((e, i) => (i === editingIndex.value ? entry : e));
  } else if (!props.multiple) {
    // Single mode — replace
    updated = [entry];
  } else {
    // Multiple add
    updated = [...entriesArray.value, entry];
  }

  emitValue(updated);
  closeModal();
}

function removeEntry(index: number) {
  const updated = entriesArray.value.filter((_, i) => i !== index);
  emitValue(updated);
}
</script>

<style scoped>
/* ── Root container ── */
.em-datetime-input {
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-2, 8px);
}
.em-datetime-input.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.datetime-label {
  font-size: var(--ion-text-sm, 14px);
  font-weight: var(--ion-font-medium, 500);
  color: var(--ion-text-color, #333);
}

.datetime-error {
  font-size: var(--ion-text-xs, 12px);
  color: var(--ion-color-danger, #eb445a);
}

/* ── Entries row ── */
.datetime-entries {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ion-space-3, 12px);
  align-items: stretch;
}

/* ── Date entry card ── */
.date-entry-card {
  display: flex;
  align-items: center;
  gap: var(--ion-space-3, 12px);
  padding: var(--ion-space-3, 12px) var(--ion-space-4, 16px);
  background: var(--ion-background-color-primary, #fff);
  border: 1px solid var(--ion-input-border-color, #e0e0e0);
  border-radius: var(--ion-radius-lg, 12px);
  min-width: 180px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.date-entry-card.clickable {
  cursor: pointer;
}
.date-entry-card.clickable:hover {
  border-color: var(--ion-color-primary, #f5a623);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.date-entry-day {
  font-size: var(--ion-text-2xl, 30px);
  font-weight: var(--ion-font-bold, 700);
  color: var(--ion-text-color, #333);
  line-height: 1;
  min-width: 32px;
  text-align: center;
}

.date-entry-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.date-entry-month {
  font-size: var(--ion-text-xs, 12px);
  font-weight: var(--ion-font-semibold, 600);
  color: var(--ion-text-color, #333);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.date-entry-time {
  font-size: var(--ion-text-xs, 12px);
  color: var(--ion-text-color-secondary, #666);
}

.date-entry-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ion-text-color-secondary, #666);
  padding: var(--ion-space-1, 4px);
  border-radius: var(--ion-radius-sm, 4px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.2s,
    background 0.2s;
}
.date-entry-remove:hover {
  color: var(--ion-color-danger, #eb445a);
  background: rgba(235, 68, 90, 0.08);
}

/* ── Add button (dashed) ── */
.add-date-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ion-space-2, 8px);
  padding: var(--ion-space-4, 16px) var(--ion-space-5, 20px);
  border: 2px dashed var(--ion-input-border-color, #d0d0d0);
  border-radius: var(--ion-radius-lg, 12px);
  background: transparent;
  color: var(--ion-text-color-secondary, #666);
  font-size: var(--ion-text-sm, 14px);
  font-weight: var(--ion-font-medium, 500);
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s,
    background 0.2s;
  min-width: 180px;
  min-height: 64px;
}
.add-date-btn:hover {
  border-color: var(--ion-color-primary, #f5a623);
  color: var(--ion-text-color, #333);
  background: rgba(245, 166, 35, 0.04);
}

/* ── Modal ── */
.datetime-modal {
  --backdrop-opacity: 0.5;
  --width: fit-content;
  --height: auto;
  --border-radius: var(--ion-radius-2xl, 24px);
  --box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}
.datetime-modal::part(content) {
  border-radius: var(--ion-radius-2xl, 24px);
  background: transparent;
  overflow: visible;
}

.modal-content {
  background: var(--ion-background-color-primary, #fff);
  border-radius: var(--ion-radius-2xl, 24px);
  padding: var(--ion-space-6, 24px);
  min-width: 340px;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-5, 20px);
  overflow: visible;
}

/* ── Modal header ── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  font-size: var(--ion-text-lg, 20px);
  font-weight: var(--ion-font-bold, 700);
  color: var(--ion-text-color, #333);
  margin: 0;
}
.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ion-text-color-secondary, #666);
  padding: var(--ion-space-1, 4px);
  border-radius: var(--ion-radius-sm, 4px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close-btn:hover {
  color: var(--ion-text-color, #333);
}

/* ── Calendar ── */
.calendar {
  border: 1px solid var(--ion-input-border-color, #e0e0e0);
  border-radius: var(--ion-radius-lg, 12px);
  padding: var(--ion-space-4, 16px);
  background: var(--ion-background-color);
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ion-space-3, 12px);
}
.calendar-nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ion-text-color, #333);
  padding: var(--ion-space-1, 4px);
  border-radius: var(--ion-radius-sm, 4px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.calendar-nav-btn:hover {
  background: var(--ion-background-color-secondary, #f5f5f5);
}
.calendar-month-label {
  font-size: var(--ion-text-sm, 14px);
  font-weight: var(--ion-font-semibold, 600);
  color: var(--ion-text-color, #333);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: var(--ion-space-1, 4px);
}
.calendar-weekday {
  font-size: var(--ion-text-xs, 12px);
  font-weight: var(--ion-font-semibold, 600);
  color: var(--ion-text-color-secondary, #999);
  padding: var(--ion-space-1, 4px) 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
}
.calendar-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 2px auto;
  font-size: var(--ion-text-sm, 14px);
  color: var(--ion-text-color, #333);
  border-radius: var(--ion-radius-full, 9999px);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  user-select: none;
}
.calendar-cell.empty {
  cursor: default;
}
.calendar-cell.disabled {
  color: var(--ion-color-medium, #999);
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
.calendar-cell:not(.empty):not(.disabled):hover {
  background: var(--ion-background-color-secondary, #f0f0f0);
}
.calendar-cell.today:not(.selected) {
  font-weight: var(--ion-font-bold, 700);
  border: 1.5px solid var(--ion-text-color, #333);
}
.calendar-cell.selected {
  background: var(--ion-text-color, #333);
  color: var(--ion-text-color-contrast);
  font-weight: var(--ion-font-semibold, 600);
}

/* ── Selected date label ── */
.selected-date-label {
  font-size: var(--ion-text-sm, 14px);
  font-weight: var(--ion-font-bold, 700);
  color: var(--ion-text-color, #333);
}

/* ── Time selectors ── */
.time-selectors {
  display: flex;
  gap: var(--ion-space-4, 16px);
  overflow: visible;
  position: relative;
  z-index: 5;
}

.time-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--ion-space-1, 4px);
}
.time-field--full {
  flex: 1;
  max-width: 200px;
}

.time-label {
  font-size: var(--ion-text-sm, 14px);
  font-weight: var(--ion-font-medium, 500);
  color: var(--ion-text-color, #333);
}
.required {
  color: var(--ion-color-danger, #eb445a);
}

.time-select-wrapper {
  position: relative;
  z-index: 10;
}

.time-select-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ion-space-2, 8px);
  padding: var(--ion-space-2, 8px) var(--ion-space-3, 12px);
  border: 1px solid var(--ion-input-border-color, #e0e0e0);
  border-radius: var(--ion-radius-base, 8px);
  background: var(--ion-input-background, #fff);
  font-size: var(--ion-text-sm, 14px);
  color: var(--ion-text-color, #333);
  cursor: pointer;
  transition: border-color 0.2s;
}
.time-select-btn:hover {
  border-color: var(--ion-input-border-color-hover, #999);
}
.time-select-btn.open {
  border-color: var(--ion-color-primary, #f5a623);
}
.time-select-btn svg {
  transition: transform 0.2s;
  color: var(--ion-text-color-secondary, #666);
}
.time-select-btn.open svg {
  transform: rotate(180deg);
}

.time-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: var(--ion-background-color-primary, #fff);
  border: 1px solid var(--ion-input-border-color, #e0e0e0);
  border-radius: var(--ion-radius-base, 8px);
  margin-top: 4px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.time-option {
  padding: var(--ion-space-2, 8px) var(--ion-space-3, 12px);
  font-size: var(--ion-text-sm, 14px);
  color: var(--ion-text-color, #333);
  cursor: pointer;
  transition: background 0.15s;
}
.time-option:hover {
  background: var(--ion-background-color-secondary, #f5f5f5);
}
.time-option.selected {
  font-weight: var(--ion-font-semibold, 600);
  background: var(--ion-background-color-secondary, #f0f0f0);
}

/* ── Modal footer ── */
.modal-footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ion-space-3, 12px);
}

.modal-btn {
  padding: var(--ion-space-2-5, 10px) var(--ion-space-5, 20px);
  border-radius: var(--ion-radius-base, 8px);
  font-size: var(--ion-text-sm, 14px);
  font-weight: var(--ion-font-semibold, 600);
  cursor: pointer;
  border: none;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.modal-btn--cancel {
  background: transparent;
  color: var(--ion-text-color, #333);
  border: 1px solid var(--ion-input-border-color, #e0e0e0);
}
.modal-btn--cancel:hover {
  background: var(--ion-background-color-secondary, #f5f5f5);
}

.modal-btn--confirm {
  background: var(--ion-color-primary, #f5a623);
  color: var(--ion-text-color-contrast);
}
.modal-btn--confirm:hover:not(:disabled) {
  opacity: 0.9;
}
.modal-btn--confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
