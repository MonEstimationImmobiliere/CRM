import apiService from '@/api/apiRequests';

export interface ReminderData {
  id?: string;
  propertyId: string;
  title: string;
  description?: string;
  date: string;
  type: 'rappel' | 'estimation' | 'visite' | 'autre';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  sharing: boolean; // Nouveau champ pour le partage
  property?: {
    address: string;
    city: string;
    owner: string;
    phone?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const ReminderService = {
  // Récupérer les rappels de l'utilisateur
  async getUserReminders(): Promise<ReminderData[]> {
    try {
      const response = await apiService.get<ReminderData[]>('/reminders/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user reminders:', error);
      throw error;
    }
  },

  // Récupérer les rappels partagés de l'agence
  async getAgencyReminders(): Promise<ReminderData[]> {
    try {
      const response = await apiService.get<ReminderData[]>('/reminders/agency');
      return response.data;
    } catch (error) {
      console.error('Error fetching agency reminders:', error);
      throw error;
    }
  },

  // Créer un nouveau rappel
  async createReminder(reminder: Omit<ReminderData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReminderData> {
    try {
      const response = await apiService.post<ReminderData>('/reminders', reminder);
      return response.data;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  },

  // Récupérer un rappel spécifique
  async getReminderById(id: string): Promise<ReminderData> {
    try {
      const response = await apiService.get<ReminderData>(`/reminders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reminder:', error);
      throw error;
    }
  },

  // Mettre à jour un rappel
  async updateReminder(id: string, reminder: Partial<ReminderData>): Promise<ReminderData> {
    try {
      const response = await apiService.put<ReminderData>(`/reminders/${id}`, reminder);
      return response.data;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  },

  // Supprimer un rappel
  async deleteReminder(id: string): Promise<void> {
    try {
      await apiService.delete(`/reminders/${id}`);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }
};
