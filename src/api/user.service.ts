import apiService from '@/api/apiRequests';

export interface AgencyUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Agency {
  id: number;
  name: string;
}

export const UserService = {
  async getUsersFromSameAgency(): Promise<AgencyUser[]> {
    const response = await apiService.get<{ users: AgencyUser[] }>(
      '/users/same-agency'
    );
    return response.data.users;
  },

  async getAgencies(): Promise<Agency[]> {
    const response = await apiService.get<{ agencies: Agency[] }>('/agencies');
    return response.data.agencies;
  },
};
