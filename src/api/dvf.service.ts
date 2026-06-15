import apiService from '@/api/apiRequests';
import type { IDvfPoint } from '@/types/dvf';

export const DvfService = {
  async getDVF(
    codeInsee: string,
    range = '1y',
    idFantoir?: string | null
  ): Promise<IDvfPoint[]> {
    const response = await apiService.get<IDvfPoint[]>('/dvf', {
      params: {
        code_insee: codeInsee,
        range,
        id_fantoir: idFantoir || undefined,
      },
    });

    return response.data;
  },

  async getParcelles(codeCommune: string): Promise<GeoJSON.FeatureCollection> {
    const response = await apiService.get<GeoJSON.FeatureCollection>('/dvfs/parcelles', {
      params: {
        code_commune: codeCommune,
      },
    });

    return response.data;
  },

  async getHistorical(codeCommune: string): Promise<any[]> {
    const response = await apiService.get<any[]>('/dvfs/historical', {
      params: {
        code_commune: codeCommune,
      },
    });

    return response.data;
  },
};