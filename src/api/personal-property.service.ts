import apiService from '@/api/apiRequests';
import type { PersonalProspection, ProspectionCommand } from '@/types/property';
import type { IAddressDetail } from '@/types/address';

export interface PersonalPropertyTarget {
  bien_type: 'address' | 'unit' | 'custom_property';
  bien_key: string;
}

export type FavoriteAddress = IAddressDetail & PersonalPropertyTarget & {
  row_id: string;
  city: string | null;
  property_type: string | null;
};

export function getPersonalPropertyTarget(row: any): PersonalPropertyTarget | null {
  if (!row) return null;
  if (row.bien_type && row.bien_key) {
    return { bien_type: row.bien_type, bien_key: String(row.bien_key) };
  }
  if (Number(row.unit_id) > 0) return { bien_type: 'unit', bien_key: String(row.unit_id) };
  if (row.row_type === 'unit' || row.row_type === 'estimation') return null;
  if (row.is_custom && Number(row.id) > 0) {
    return { bien_type: 'custom_property', bien_key: String(row.id) };
  }
  const address = String(row.id_fantoir_long ?? '').trim();
  if (address) return { bien_type: 'address', bien_key: address };
  if (Number(row.id) > 0) return { bien_type: 'custom_property', bien_key: String(row.id) };
  return null;
}

export function personalPropertyKey(target: PersonalPropertyTarget): string {
  return `${target.bien_type}:${target.bien_key}`;
}

export const PersonalPropertyService = {
  async getFavorites(includeDvf = false, signal?: AbortSignal) {
    const { data } = await apiService.get<FavoriteAddress[]>('/favorites', {
      params: { include_dvf: includeDvf ? 1 : undefined },
      signal,
    });
    return data;
  },

  async addFavorite(target: PersonalPropertyTarget) {
    const { data } = await apiService.put<FavoriteAddress>('/favorites', target);
    return data;
  },

  async removeFavorite(target: PersonalPropertyTarget) {
    await apiService.delete('/favorites', { data: target });
  },

  async getProspection(target: PersonalPropertyTarget) {
    const { data } = await apiService.get<{ prospection: PersonalProspection | null }>(
      '/prospection', { params: target }
    );
    return data.prospection;
  },

  async saveProspection(target: PersonalPropertyTarget, command: ProspectionCommand) {
    const { data } = await apiService.put<{ prospection: PersonalProspection }>(
      '/prospection', { ...target, ...command }
    );
    return data.prospection;
  },
};
