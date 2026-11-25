import apiService from '@/api/apiRequests';
import type { DvfSaleIdentity, IDvfPoint } from '@/types/dvf';
import type { ParcelBounds } from '@/composables/useParcelViewport';

export const DvfService = {
  async getSale(codeInsee: string, identity: DvfSaleIdentity): Promise<IDvfPoint[]> {
    const response = await apiService.get<IDvfPoint[]>('/dvf', {
      params: {
        code_insee: codeInsee,
        id_mutation: identity.id_mutation,
        numero_disposition: identity.numero_disposition,
        date_mutation: identity.date_mutation,
      },
    });
    return response.data;
  },

  async getDVF(
    codeInsee: string,
    range = '1y',
    idFantoir?: string | null,
    numero?: string,
    rep?: string,
    signal?: AbortSignal,
  ): Promise<IDvfPoint[]> {
    const response = await apiService.get<IDvfPoint[]>('/dvf', {
      signal,
      params: {
        code_insee: codeInsee,
        range,
        id_fantoir: idFantoir || undefined,
        numero: numero || undefined,
        rep: numero ? rep : undefined,
      },
    });

    return response.data;
  },

  async getParcellesByViewport(bounds: ParcelBounds, signal: AbortSignal): Promise<GeoJSON.FeatureCollection> {
    const response = await apiService.get<GeoJSON.FeatureCollection>('/dvfs/parcelles/viewport', {
      params: bounds,
      signal,
    });

    return response.data;
  },

  async getHistorical(codeCommune: string, numero?: string, rep?: string, signal?: AbortSignal): Promise<any[]> {
    const response = await apiService.get<any[]>('/dvfs/historical', {
      signal,
      params: {
        code_commune: codeCommune,
        numero: numero || undefined,
        rep: numero ? rep : undefined,
      },
    });

    return response.data;
  },
};
