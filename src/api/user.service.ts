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

interface AvailableAgencies {
  agencies: Agency[];
  current_agency_id: number | null;
}

export const UserService = {
  async getAuthenticatedRole(signal: AbortSignal): Promise<string | undefined> {
    const { data } = await apiService.get<{ role?: string }>('/user', { signal });
    return data.role;
  },

  async getUsersFromSameAgency(): Promise<AgencyUser[]> {
    const response = await apiService.get<{ users: AgencyUser[] }>(
      '/users/same-agency'
    );
    return response.data.users;
  },

  async getAgencies(ownAgencyOnly = false): Promise<Agency[]> {
    const { data } = await apiService.get<AvailableAgencies>('/agencies');
    return ownAgencyOnly
      ? data.agencies.filter(agency => Number(agency.id) === Number(data.current_agency_id))
      : data.agencies;
  },
};
