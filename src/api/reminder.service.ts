import apiService from '@/api/apiRequests';
import type {
  IReminder,
  IReminderCreate,
  IReminderUpdate,
  ReminderList,
} from '@/types/reminder';

export const ReminderService = {
  async getUserReminders(): Promise<ReminderList> {
    const response = await apiService.get<ReminderList>('/reminders/user');
    return response.data;
  },

  async getAgencyReminders(): Promise<ReminderList> {
    const response = await apiService.get<ReminderList>('/reminders/agency');
    return response.data;
  },

  async createReminder(reminder: IReminderCreate): Promise<IReminder> {
    const response = await apiService.post<IReminder>('/reminders', reminder);
    return response.data;
  },

  async getReminderById(id: number): Promise<IReminder> {
    const response = await apiService.get<IReminder>(`/reminders/${id}`);
    return response.data;
  },

  async updateReminder(
    id: number,
    reminder: Partial<IReminderUpdate>
  ): Promise<IReminder> {
    const response = await apiService.put<IReminder>(
      `/reminders/${id}`,
      reminder
    );
    return response.data;
  },

  async deleteReminder(id: number): Promise<void> {
    await apiService.delete(`/reminders/${id}`);
  },
};
