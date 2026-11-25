import apiService from '@/api/apiRequests';

export type DvfCategory = 'house' | 'apartment' | 'commercial' | 'residential';

export interface DvfSample {
  sales_count: number;
  median_price_per_m2: number | null;
  limited_sample: boolean;
  indicative_median_price_per_m2?: number | null;
  raw_median_price_per_m2?: number | null;
  temporal_median_price_per_m2?: number | null;
  classic_median_price_per_m2?: number | null;
  reference_price_per_m2?: number | null;
  eligible_for_street_comparison?: boolean;
  dispersion_percent?: number | null;
  street_fallback_reason?: 'insufficient_sales' | 'excessive_dispersion' | 'reference_unavailable' | null;
  commune_weight?: number;
}

export interface DvfStatistics {
  street_min_sales?: number;
  max_dispersion_percent?: number;
  period: { from: string; to: string } | null;
  commune_weight?: number;
  commune: Record<DvfCategory, DvfSample> | null;
  street: Record<DvfCategory, DvfSample> | null;
  streets?: Record<string, {
    residential?: DvfSample;
    unit_categories?: Partial<Record<'apartment' | 'commercial', DvfSample>>;
    latest_sale?: { date: string; price: number | null };
  }>;
}

export async function getDvfStatistics(codeInsee: string, streetKey: string | undefined, signal: AbortSignal, includeStreets = false) {
  const { data } = await apiService.get<DvfStatistics>('/dvfs/statistics', {
    params: { code_insee: codeInsee, id_fantoir: streetKey, include_streets: includeStreets ? 1 : undefined },
    signal,
  });
  return data;
}
