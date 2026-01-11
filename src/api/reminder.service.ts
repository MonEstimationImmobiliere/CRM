import apiService from '@/api/apiRequests';
import type { IReminder, IReminderCreate, IReminderUpdate, ReminderList } from '@/types/reminder';

/**
 * @deprecated Utiliser IReminder, IReminderCreate depuis @/types/reminder
 */
export interface ReminderData {
  id?: string;
  property_id: string;
  title: string;
  description?: string;
  date: string;
  type: 'rappel' | 'estimation' | 'visite' | 'autre';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  sharing: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const ReminderService = {
  // Récupérer les rappels de l'utilisateur
  async getUserReminders(): Promise<ReminderList> {
    try {
      const response = await apiService.get<ReminderList>('/reminders/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user reminders:', error);
      throw error;
    }
  },

  // Récupérer les rappels partagés de l'agence
  async getAgencyReminders(): Promise<ReminderList> {
    try {
      const response = await apiService.get<ReminderList>('/reminders/agency');
      return response.data;
    } catch (error) {
      console.error('Error fetching agency reminders:', error);
      throw error;
    }
  },

  // Créer un nouveau rappel
  async createReminder(reminder: IReminderCreate): Promise<IReminder> {
    try {
      const response = await apiService.post<IReminder>('/reminders', reminder);
      return response.data;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  },

  // Récupérer un rappel spécifique
  async getReminderById(id: number): Promise<IReminder> {
    try {
      const response = await apiService.get<IReminder>(`/reminders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reminder:', error);
      throw error;
    }
  },

  // Mettre à jour un rappel
  async updateReminder(id: number, reminder: Partial<IReminderUpdate>): Promise<IReminder> {
    try {
      const response = await apiService.put<IReminder>(`/reminders/${id}`, reminder);
      return response.data;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  },

  // Supprimer un rappel
  async deleteReminder(id: number): Promise<void> {
    try {
      await apiService.delete(`/reminders/${id}`);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }
};
