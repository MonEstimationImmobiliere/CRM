import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { NotificationService } from '@/utils/notifications';
import {
  ReminderService,
  type ReminderScope,
  type ReminderScopeOptions,
} from '@/api/reminder.service';
import { isOverdue as helperIsOverdue, isToday as helperIsToday } from '@/utils/reminderHelpers';
import type {
  IReminder,
  IReminderCreate,
  ReminderType,
  ReminderPriority,
  ReminderList,
} from '@/types/reminder';

/**
 * Interface locale du store avec status additionnel pour le Kanban
 */
export interface Reminder extends IReminder {
  status?: 'todo' | 'progress' | 'completed';
}

export const useRemindersStore = defineStore('reminders', () => {
  const user = useUserStore();
  const reminders = ref<Reminder[]>([]);
  const agencyReminders = ref<Reminder[]>([]);
  const loading = ref(false);
  const selectedReminder = ref<Reminder | null>(null);
  const remindersViewType = ref<'table' | 'card' | 'calendar'>('table');

  // Cache in-memory par scope (durée de vie = session, invalidé sur mutation)
  const scopeCache = new Map<string, Reminder[]>();

  const buildCacheKey = (scope: ReminderScope, options?: ReminderScopeOptions): string =>
    `${scope}-${options?.completed ? '1' : '0'}`;

  let scopeRequest = 0;
  const invalidateCache = () => {
    scopeRequest++;
    scopeCache.clear();
    loading.value = false;
  };
  watch(() => user.token, () => {
    invalidateCache();
    reminders.value = [];
    agencyReminders.value = [];
    selectedReminder.value = null;
  }, { flush: 'sync' });

  // Load reminders from API
  const loadReminders = async () => {
    const token = user.token;
    const request = scopeRequest;
    try {
      loading.value = true;
      const [userReminders, sharedReminders] = await Promise.all([
        ReminderService.getUserReminders(),
        ReminderService.getAgencyReminders(),
      ]);
      if (token !== user.token) return;

      if (request === scopeRequest) {
        reminders.value = userReminders
          .filter((r) => r.id)
          .map((r) => ({ ...r, sharing: r.sharing || false }));
      }

      agencyReminders.value = sharedReminders
        .filter((r) => r.id)
        .map((r) => ({ ...r, sharing: r.sharing || false }));

    } catch {
      if (token === user.token) agencyReminders.value = [];
    } finally {
      if (token === user.token && request === scopeRequest) loading.value = false;
    }
  };

  // Initialize store with sample data if none exists
  const initializeStore = async () => {
    await loadReminders();

    // Add sample reminders if the store is empty (for development/testing)
    if (reminders.value.length === 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const sampleReminders: IReminderCreate[] = [
        {
          title: "Visite d'estimation",
          description: 'Rendez-vous avec le propriétaire pour évaluer les travaux de rénovation',
          date: yesterday.toISOString().split('T')[0],
          type: 'estimation',
          priority: 'high',
          sharing: false,
          property_id: 1,
          completed: false,
        },
        {
          title: 'Rappel de suivi',
          description: 'Contacter le propriétaire pour discuter de la vente',
          date: today.toISOString().split('T')[0],
          type: 'rappel',
          priority: 'medium',
          sharing: true,
          property_id: 1,
          completed: false,
        },
        {
          title: 'Visite programmée',
          description: 'Visite avec des acheteurs potentiels',
          date: tomorrow.toISOString().split('T')[0],
          type: 'visite',
          priority: 'high',
          sharing: false,
          property_id: 1,
          completed: false,
        },
        {
          title: 'Rappel terminé',
          description: 'Documents transmis au notaire',
          date: yesterday.toISOString().split('T')[0],
          type: 'autre',
          priority: 'low',
          sharing: false,
          property_id: 1,
          completed: true,
        },
      ];

      for (const reminder of sampleReminders) {
        await addReminder(reminder);
      }
    }
  };

  // initializeStore() est intentionnellement retiré ici :
  // le chargement initial est déclenché par le watch { immediate: true } dans Reminders.vue
  // ce qui garantit que le bon scope/completed est utilisé dès l'ouverture de la page.

  // Computed properties pour tous les rappels (utilisateur + agence)
  const allReminders = computed(() => [...reminders.value, ...agencyReminders.value]);

  const todayReminders = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return allReminders.value.filter((reminder) => reminder.date === today && !reminder.completed);
  });

  const upcomingReminders = computed(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return allReminders.value.filter((reminder) => {
      const reminderDate = new Date(reminder.date);
      return reminderDate > today && reminderDate <= nextWeek && !reminder.completed;
    });
  });

  const overdueReminders = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return allReminders.value.filter((reminder) => reminder.date < today && !reminder.completed);
  });

  const completedReminders = computed(() => {
    return allReminders.value.filter((reminder) => reminder.completed);
  });

  const remindersByType = computed(() => {
    return reminders.value.reduce(
      (acc, reminder) => {
        if (!acc[reminder.type]) {
          acc[reminder.type] = [];
        }
        acc[reminder.type].push(reminder);
        return acc;
      },
      {} as Record<string, Reminder[]>
    );
  });

  const remindersByPriority = computed(() => {
    return {
      high: reminders.value.filter((r) => r.priority === 'high' && !r.completed),
      medium: reminders.value.filter((r) => r.priority === 'medium' && !r.completed),
      low: reminders.value.filter((r) => r.priority === 'low' && !r.completed),
    };
  });

  // Actions
  const addReminder = async (reminderData: IReminderCreate) => {
    const token = user.token;
    try {
      const newReminder = await ReminderService.createReminder({
        ...reminderData,
        sharing: reminderData.sharing || false,
      });

      const reminderWithDefaults: Reminder = {
        ...newReminder,
        sharing: newReminder.sharing || false,
      };

      if (token !== user.token) return reminderWithDefaults;
      invalidateCache();
      reminders.value.push(reminderWithDefaults);
      NotificationService.reminderCreated(reminderWithDefaults.title);
      return reminderWithDefaults;
    } catch (error: any) {
      console.error('Erreur API création rappel complète', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

      throw error;
    }
  };

  const updateReminder = async (id: number, updates: Partial<IReminderCreate>) => {
    const token = user.token;
    const { status: _status, ...apiUpdates } = updates as Partial<IReminderCreate> & {
      status?: string;
    };

    const updatedReminder = await ReminderService.updateReminder(id, apiUpdates);
    if (token !== user.token) return;
    invalidateCache();
    const index = reminders.value.findIndex((r) => r.id === id);
    if (!updatedReminder?.id) {
      if (index !== -1) reminders.value.splice(index, 1);
      agencyReminders.value = agencyReminders.value.filter(reminder => reminder.id !== id);
      return;
    }
    const current: Reminder = { ...updatedReminder, sharing: updatedReminder.sharing || false };
    if (index !== -1) reminders.value[index] = current;
    const agencyIndex = agencyReminders.value.findIndex(reminder => reminder.id === id);
    if (agencyIndex !== -1) agencyReminders.value[agencyIndex] = current;
    NotificationService.reminderUpdated(current.title);
    return current;
  };

  const deleteReminder = async (id: number) => {
    const token = user.token;
    try {
      await ReminderService.deleteReminder(id);
    } catch {
      return false;
    }

    if (token !== user.token) return false;
    const index = reminders.value.findIndex((r) => r.id === id);
    if (index !== -1) {
      invalidateCache();
      const deletedReminder = reminders.value[index];
      reminders.value.splice(index, 1);
      NotificationService.reminderDeleted(deletedReminder.title);
      return true;
    }
    return false;
  };

  const completeReminder = async (id: number) => {
    const updated = await updateReminder(id, { completed: true });
    if (updated) {
      NotificationService.reminderCompleted(updated.title);
    }
    return updated;
  };

  const uncompleteReminder = (id: number) => {
    return updateReminder(id, { completed: false });
  };

  const updateReminderStatus = async (id: number, status: 'todo' | 'progress' | 'completed') => {
    const updated = await updateReminder(id, { completed: status === 'completed' });
    if (updated) updated.status = status;
    return updated;
  };

  const selectReminder = (reminder: Reminder | null) => {
    selectedReminder.value = reminder;
  };

  const getReminderById = (id: number) => {
    return reminders.value.find((r) => r.id === id);
  };

  const getRemindersByProperty = (propertyId: number) => {
    const matches = [...agencyReminders.value, ...reminders.value].filter(r => r.property_id === propertyId);
    return [...new Map(matches.map(reminder => [reminder.id, reminder])).values()];
  };

  const getRemindersByDateRange = (startDate: string, endDate: string) => {
    return reminders.value.filter(
      (reminder) => reminder.date >= startDate && reminder.date <= endDate
    );
  };

  const clearAllReminders = () => {
    reminders.value = [];
  };

  const clearCompletedReminders = () => {
    reminders.value = reminders.value.filter((r) => !r.completed);
  };

  // Utility functions
  const getRemindersCount = () => {
    return {
      total: reminders.value.length,
      completed: completedReminders.value.length,
      pending: reminders.value.filter((r) => !r.completed).length,
      overdue: overdueReminders.value.length,
      today: todayReminders.value.length,
      upcoming: upcomingReminders.value.length,
    };
  };

  const isReminderOverdue = (reminder: Reminder) => {
    return helperIsOverdue(reminder.date, reminder.completed);
  };

  const isReminderToday = (reminder: Reminder) => {
    return helperIsToday(reminder.date);
  };

  const isReminderUpcoming = (reminder: Reminder) => {
    const today = new Date();
    const reminderDate = new Date(reminder.date);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return reminderDate > today && reminderDate <= nextWeek;
  };

  const setRemindersViewType = (viewType: 'table' | 'card' | 'calendar') => {
    remindersViewType.value = viewType;
  };

  const loadRemindersByScope = async (scope: ReminderScope, options?: ReminderScopeOptions) => {
    const request = ++scopeRequest;
    const key = buildCacheKey(scope, options);

    // Serve from cache if available — no network round-trip needed
    if (scopeCache.has(key)) {
      reminders.value = scopeCache.get(key)!;
      loading.value = false;
      return;
    }

    try {
      loading.value = true;
      const data = await ReminderService.getRemindersByScope(scope, options);
      if (request !== scopeRequest) return;
      const normalised = data
        .filter((r) => r.id)
        .map((r) => ({ ...r, sharing: r.sharing || false }));
      scopeCache.set(key, normalised);
      reminders.value = normalised;
    } catch {
      if (request === scopeRequest) reminders.value = [];
    } finally {
      if (request === scopeRequest) loading.value = false;
    }
  };

  return {
    // State
    reminders,
    agencyReminders,
    loading,
    selectedReminder,
    remindersViewType,

    // Computed
    todayReminders,
    upcomingReminders,
    overdueReminders,
    completedReminders,
    remindersByType,
    remindersByPriority,

    // Actions
    loadReminders,
    initializeStore,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    uncompleteReminder,
    updateReminderStatus,
    selectReminder,
    getReminderById,
    getRemindersByProperty,
    getRemindersByDateRange,
    clearAllReminders,
    clearCompletedReminders,
    getRemindersCount,
    isReminderOverdue,
    isReminderToday,
    isReminderUpcoming,
    setRemindersViewType,
    loadRemindersByScope,
  };
});
