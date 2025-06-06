import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { LocalStorage, STORAGE_KEYS } from '@/utils/localStorage';
import { NotificationService } from '@/utils/notifications';

export interface Reminder {
  id: string;
  propertyId: string;
  title: string;
  description?: string;
  date: string;
  type: 'rappel' | 'estimation' | 'visite' | 'autre';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  property?: {
    address: string;
    city: string;
    owner: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const useRemindersStore = defineStore('reminders', () => {
  const reminders = ref<Reminder[]>([]);
  const loading = ref(false);
  const selectedReminder = ref<Reminder | null>(null);

  // Load reminders from localStorage on store initialization
  const loadReminders = () => {
    if (LocalStorage.isAvailable()) {
      const savedReminders = LocalStorage.get<Reminder[]>(STORAGE_KEYS.REMINDERS);
      if (savedReminders && Array.isArray(savedReminders)) {
        reminders.value = savedReminders;
      }
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

  // Computed properties
  const todayReminders = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.value.filter(reminder => 
      reminder.date === today && !reminder.completed
    );
  });

  const upcomingReminders = computed(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return reminders.value.filter(reminder => {
      const reminderDate = new Date(reminder.date);
      return reminderDate > today && 
             reminderDate <= nextWeek && 
             !reminder.completed;
    });
  });

  const overdueReminders = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.value.filter(reminder => 
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
  const addReminder = (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reminders.value.push(newReminder);
    
    // Send notification
    NotificationService.reminderCreated(newReminder.title);
    
    return newReminder;
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
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
    return null;
  };

  const deleteReminder = (id: string) => {
    const index = reminders.value.findIndex(r => r.id === id);
    if (index !== -1) {
      const deletedReminder = reminders.value[index];
      reminders.value.splice(index, 1);
      
      // Send notification
      NotificationService.reminderDeleted(deletedReminder.title);
      
      return true;
    }
    return false;
  };

  const completeReminder = (id: string) => {
    const updated = updateReminder(id, { completed: true });
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
    return reminders.value.filter(r => r.propertyId === propertyId);
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

  // Initialiser avec des données d'exemple si vide
  const initializeSampleData = () => {
    if (reminders.value.length === 0) {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const sampleReminders: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          title: 'Rappel estimation M. Dupont',
          description: 'Rappeler M. Dupont pour finaliser l\'estimation de sa maison avenue des Roses',
          date: yesterday.toISOString().split('T')[0],
          type: 'rappel',
          priority: 'high',
          propertyId: 'prop_001',
          completed: false,
          property: {
            address: '123 Avenue des Roses',
            city: 'Paris 16ème',
            owner: 'M. Jean Dupont',
            phone: '01 42 34 56 78',
            email: 'jean.dupont@email.com',
          },
        },
        {
          title: 'Visite Mme Martin',
          description: 'Visite d\'expertise pour appartement 3 pièces',
          date: today.toISOString().split('T')[0],
          type: 'visite',
          priority: 'medium',
          propertyId: 'prop_002',
          completed: false,
          property: {
            address: '45 Rue de la République',
            city: 'Lyon 2ème',
            owner: 'Mme Sophie Martin',
            phone: '04 78 90 12 34',
            email: 'sophie.martin@email.com',
          },
        },
        {
          title: 'Estimation maison familiale',
          description: 'Estimation pour maison 5 pièces avec jardin',
          date: tomorrow.toISOString().split('T')[0],
          type: 'estimation',
          priority: 'medium',
          propertyId: 'prop_003',
          completed: false,
          property: {
            address: '78 Boulevard des Lilas',
            city: 'Marseille 8ème',
            owner: 'M. et Mme Rousseau',
            phone: '04 91 23 45 67',
          },
        },
        {
          title: 'Suivi dossier Lemoine',
          description: 'Relancer M. Lemoine sur les documents manquants',
          date: nextWeek.toISOString().split('T')[0],
          type: 'autre',
          priority: 'low',
          propertyId: 'prop_004',
          completed: false,
          property: {
            address: '12 Place du Marché',
            city: 'Toulouse',
            owner: 'M. Pierre Lemoine',
            phone: '05 34 56 78 90',
          },
        },
      ];

      sampleReminders.forEach(reminder => addReminder(reminder));
    }
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

  // Initialize with sample data if empty (for demo purposes)
  if (reminders.value.length === 0) {
    initializeSampleData();
  }

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
    initializeSampleData,
  };
});
