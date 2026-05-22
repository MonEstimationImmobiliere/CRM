import apiService from '@/api/apiRequests';
import type {
  IReminder,
  IReminderCreate,
  IReminderUpdate,
  ReminderList,
} from '@/types/reminder';

export type ReminderScope = 'me' | 'all' | 'agency' | 'user';

export interface ReminderScopeOptions {
  userId?: number;
  agencyId?: number;
  completed?: boolean;
}

export const ReminderService = {
  async getUserReminders(): Promise<ReminderList> {
    const response = await apiService.get<ReminderList>('/reminders?scope=me');
    return response.data;
  },

  async getAgencyReminders(): Promise<ReminderList> {
    const response = await apiService.get<ReminderList>(
      '/reminders?scope=agency'
    );
    return response.data;
  },

  async getRemindersByUser(userId: number): Promise<ReminderList> {
    const response = await apiService.get<ReminderList>(
      `/reminders?scope=user&user_id=${userId}`
    );
    return response.data;
  },

  async getRemindersByScope(
    scope: ReminderScope,
    options?: ReminderScopeOptions
  ): Promise<ReminderList> {
    const params = new URLSearchParams({ scope });
    if (scope === 'user' && options?.userId) {
      params.set('user_id', String(options.userId));
    }
    if (scope === 'agency' && options?.agencyId) {
      params.set('agency_id', String(options.agencyId));
    }
    if (options?.completed) {
      params.set('completed', '1');
    }
    const response = await apiService.get<ReminderList>(
      `/reminders?${params.toString()}`
    );
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
