import apiService from '@/api/apiRequests';
import type { IUnit } from '@/types/unit';
import type { IProperty } from '@/types/property';

export const UnitService = {
  async save(unit: IUnit & { property_id: number; dvf_sale_key?: string; surface?: number; rooms?: number }): Promise<{ unit: IUnit; property: IProperty }> {
    console.log('UNIT SAVE payload envoyé au backend:', unit);

    try {
      const response = await apiService.post<{ unit: IUnit; property: IProperty }>('/unit/save', unit);
      console.log('UNIT SAVE réponse backend:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('UNIT SAVE erreur backend:', error?.response?.data);
      throw error;
    }
  },
};
