import apiService from '@/api/apiRequests';
import type { IUnit } from '@/types/unit';

export const UnitService = {
  async save(unit: IUnit): Promise<IUnit> {
    console.log('UNIT SAVE payload envoyé au backend:', unit);

    try {
      const response = await apiService.post<IUnit>('/unit/save', unit);
      console.log('UNIT SAVE réponse backend:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('UNIT SAVE erreur backend:', error?.response?.data);
      throw error;
    }
  },
};
