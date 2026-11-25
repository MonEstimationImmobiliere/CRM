import apiService from '@/api/apiRequests';
import type { ProspectionProgress } from '@/utils/prospectionProgress';
import type { PersonalPropertyTarget } from './personal-property.service';

export type ProspectionScope = 'me' | 'agency' | 'group' | 'agent' | 'delegated';

export interface ProspectionScopeFilters {
  scope: ProspectionScope;
  agency_id?: number;
  agency_group_id?: number;
  user_id?: number;
}

export interface ProspectionScopes {
  agency_group_id: number;
  agency_id: number;
  scopes: ProspectionScope[];
  agencies: { id: number; name: string }[];
  agency_scope_agencies: { id: number; name: string }[];
  delegated_agency_ids: number[];
  agents: { id: number; name: string; agency_id: number }[];
}

export interface ProspectionHistoryEntry {
  id: number;
  agent: { id: number; name: string | null };
  agency_id: number;
  agency_group_id: number;
  operation: 'validation' | 'renewal';
  prospection_years: number;
  prospection_months: number;
  prospection_validated_at: string;
  prospection_expires_at: string;
  status: 'valid' | 'expired' | 'pending';
}

interface ProspectionHistoryPage {
  server_now: string;
  history: { data: ProspectionHistoryEntry[]; current_page: number; last_page: number };
}

export interface ProgressFilters extends Partial<ProspectionScopeFilters> {
  code_insee?: string;
  id_fantoir?: string;
  address_keys?: string[];
}

export async function getProspectionScopes() {
  const { data } = await apiService.get<ProspectionScopes>('/prospection/scopes');
  return data;
}

export async function getProspectionHistory(target: PersonalPropertyTarget, scope: ProspectionScopeFilters, page: number) {
  const { data } = await apiService.get<ProspectionHistoryPage>('/prospection/supervision', {
    params: { ...target, ...scope, page },
  });
  return data;
}

export async function getProspectionProgress(filters: ProgressFilters) {
  const { data } = await apiService.post<ProspectionProgress>('/prospection/progress', filters);
  return data;
}
