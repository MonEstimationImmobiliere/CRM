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
};