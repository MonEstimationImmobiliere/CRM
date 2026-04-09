import apiService from '@/api/apiRequests';
import type { IUnit } from '@/types/unit';

export const UnitService = {
  async saveUnit(unit: IUnit): Promise<IUnit> {
    const response = await apiService.post<IUnit>('/api/unit/save', unit);
    return response.data;
  },
};
