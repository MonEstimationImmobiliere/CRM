import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { LocalStorage, STORAGE_KEYS } from '@/utils/localStorage';
import { NotificationService } from '@/utils/notifications';
import { ReminderService } from '@/api/reminder.service';

export interface Reminder {
  id: string;
  property_id: string;
  title: string;
  description?: string;
  date: string;
  type: 'rappel' | 'estimation' | 'visite' | 'autre';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  sharing: boolean; // Nouveau champ pour le partage
  createdAt?: string;
  updatedAt?: string;
}

export const useRemindersStore = defineStore('reminders', () => {
  const reminders = ref<Reminder[]>([]);
  const agencyReminders = ref<Reminder[]>([]);
  const loading = ref(false);
  const selectedReminder = ref<Reminder | null>(null);

  // Load reminders from API
  const loadReminders = async () => {
    try {
      loading.value = true;
      const [userReminders, sharedReminders] = await Promise.all([
        ReminderService.getUserReminders(),
        ReminderService.getAgencyReminders()
      ]);
      
      reminders.value = userReminders
        .filter(r => r.id) // S'assurer que l'ID existe
        .map(r => ({
          ...r,
          id: r.id!,
          sharing: r.sharing || false,
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString()
        }));
      
      agencyReminders.value = sharedReminders
        .filter(r => r.id) // S'assurer que l'ID existe
        .map(r => ({
          ...r,
          id: r.id!,
          sharing: r.sharing || false,
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString()
        }));
      
      // Fallback: also save to localStorage 
      if (LocalStorage.isAvailable()) {
        LocalStorage.set(STORAGE_KEYS.REMINDERS, reminders.value);
      }
    } catch (error) {
      console.error('Error loading reminders from API, falling back to localStorage:', error);
      // Fallback to localStorage
      if (LocalStorage.isAvailable()) {
        const savedReminders = LocalStorage.get<Reminder[]>(STORAGE_KEYS.REMINDERS);
        if (savedReminders && Array.isArray(savedReminders)) {
          reminders.value = savedReminders.map(r => ({
            ...r,
            sharing: r.sharing || false
          }));
        }
      }
    } finally {
      loading.value = false;
    }
  };

  // Save reminders to localStorage
  const saveReminders = () => {
    if (LocalStorage.isAvailable()) {
      LocalStorage.set(STORAGE_KEYS.REMINDERS, reminders.value);
    }
  };

  // Watch for changes in reminders and save to localStorage
  watch(
    reminders,
    () => {
      saveReminders();
    },
    { deep: true }
  );

  // Initialize store
  loadReminders();

  // Computed properties pour tous les rappels (utilisateur + agence)
  const allReminders = computed(() => [
    ...reminders.value,
    ...agencyReminders.value
  ]);

  const todayReminders = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return allReminders.value.filter(reminder => 
      reminder.date === today && !reminder.completed
    );
  });

  const upcomingReminders = computed(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return allReminders.value.filter(reminder => {
      const reminderDate = new Date(reminder.date);
      return reminderDate > today && 
             reminderDate <= nextWeek && 
             !reminder.completed;
    });
  });

  const overdueReminders = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return allReminders.value.filter(reminder => 
      reminder.date < today && !reminder.completed
    );
  });

  const completedReminders = computed(() => {
    return reminders.value.filter(reminder => reminder.completed);
  });

  const remindersByType = computed(() => {
    return reminders.value.reduce((acc, reminder) => {
      if (!acc[reminder.type]) {
        acc[reminder.type] = [];
      }
      acc[reminder.type].push(reminder);
      return acc;
    }, {} as Record<string, Reminder[]>);
  });

  const remindersByPriority = computed(() => {
    return {
      high: reminders.value.filter(r => r.priority === 'high' && !r.completed),
      medium: reminders.value.filter(r => r.priority === 'medium' && !r.completed),
      low: reminders.value.filter(r => r.priority === 'low' && !r.completed),
    };
  });

  // Actions
  const addReminder = async (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Essayer d'abord l'API
      const newReminder = await ReminderService.createReminder({
        ...reminder,
        sharing: reminder.sharing || false
      });
      
      const reminderWithDefaults: Reminder = {
        ...newReminder,
        id: newReminder.id!,
        sharing: newReminder.sharing || false,
        createdAt: newReminder.createdAt || new Date().toISOString(),
        updatedAt: newReminder.updatedAt || new Date().toISOString(),
      };
      
      reminders.value.push(reminderWithDefaults);
      
      // Send notification
      NotificationService.reminderCreated(reminderWithDefaults.title);
      
      return reminderWithDefaults;
    } catch (error) {
      console.error('Error creating reminder via API, falling back to local:', error);
      
      // Fallback local
      const localReminder: Reminder = {
        ...reminder,
        id: Date.now().toString(),
        sharing: reminder.sharing || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reminders.value.push(localReminder);
      
      // Send notification
      NotificationService.reminderCreated(localReminder.title);
      
      return localReminder;
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      // Essayer d'abord l'API
      const updatedReminder = await ReminderService.updateReminder(id, updates);
      
      const index = reminders.value.findIndex(r => r.id === id);
      if (index !== -1) {
        reminders.value[index] = {
          ...updatedReminder,
          id: updatedReminder.id!,
          sharing: updatedReminder.sharing || false,
          createdAt: updatedReminder.createdAt || reminders.value[index].createdAt,
          updatedAt: updatedReminder.updatedAt || new Date().toISOString(),
        };
        
        // Send notification for important updates
        NotificationService.reminderUpdated(reminders.value[index].title);
        
        return reminders.value[index];
      }
    } catch (error) {
      console.error('Error updating reminder via API, falling back to local:', error);
      
      // Fallback local
      const index = reminders.value.findIndex(r => r.id === id);
      if (index !== -1) {
        reminders.value[index] = {
          ...reminders.value[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        // Send notification for important updates
        NotificationService.reminderUpdated(reminders.value[index].title);
        
        return reminders.value[index];
      }
    }
    return null;
  };

  const deleteReminder = async (id: string) => {
    try {
      // Essayer d'abord l'API
      await ReminderService.deleteReminder(id);
      
      const index = reminders.value.findIndex(r => r.id === id);
      if (index !== -1) {
        const deletedReminder = reminders.value[index];
        reminders.value.splice(index, 1);
        
        // Send notification
        NotificationService.reminderDeleted(deletedReminder.title);
        
        return true;
      }
    } catch (error) {
      console.error('Error deleting reminder via API, falling back to local:', error);
      
      // Fallback local
      const index = reminders.value.findIndex(r => r.id === id);
      if (index !== -1) {
        const deletedReminder = reminders.value[index];
        reminders.value.splice(index, 1);
        
        // Send notification
        NotificationService.reminderDeleted(deletedReminder.title);
        
        return true;
      }
    }
    return false;
  };

  const completeReminder = async (id: string) => {
    const updated = await updateReminder(id, { completed: true });
    if (updated) {
      NotificationService.reminderCompleted(updated.title);
    }
    return updated;
  };

  const uncompleteReminder = (id: string) => {
    return updateReminder(id, { completed: false });
  };

  const selectReminder = (reminder: Reminder | null) => {
    selectedReminder.value = reminder;
  };

  const getReminderById = (id: string) => {
    return reminders.value.find(r => r.id === id);
  };

  const getRemindersByProperty = (propertyId: string) => {
    return reminders.value.filter(r => r.property_id === propertyId);
  };

  const getRemindersByDateRange = (startDate: string, endDate: string) => {
    return reminders.value.filter(reminder => 
      reminder.date >= startDate && reminder.date <= endDate
    );
  };

  const clearAllReminders = () => {
    reminders.value = [];
  };

  const clearCompletedReminders = () => {
    reminders.value = reminders.value.filter(r => !r.completed);
  };



  // Utility functions
  const getRemindersCount = () => {
    return {
      total: reminders.value.length,
      completed: completedReminders.value.length,
      pending: reminders.value.filter(r => !r.completed).length,
      overdue: overdueReminders.value.length,
      today: todayReminders.value.length,
      upcoming: upcomingReminders.value.length,
    };
  };

  const isReminderOverdue = (reminder: Reminder) => {
    const today = new Date().toISOString().split('T')[0];
    return reminder.date < today && !reminder.completed;
  };

  const isReminderToday = (reminder: Reminder) => {
    const today = new Date().toISOString().split('T')[0];
    return reminder.date === today;
  };

  const isReminderUpcoming = (reminder: Reminder) => {
    const today = new Date();
    const reminderDate = new Date(reminder.date);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return reminderDate > today && reminderDate <= nextWeek;
  };


  return {
    // State
    reminders,
    loading,
    selectedReminder,
    
    // Computed
    todayReminders,
    upcomingReminders,
    overdueReminders,
    completedReminders,
    remindersByType,
    remindersByPriority,
    
    // Actions
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    uncompleteReminder,
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
  };
});
