import type { DvfSample, DvfStatistics } from '@/api/dvf-statistics.service';

export type DvfTooltip = { lines: string[]; reference: string };
export type DvfResidentialReference = { median: number; scope: 'street' | 'commune'; tooltip?: DvfTooltip; lowReliability?: boolean };

export function savedSimulationPricePerM2(row: { price?: number | string | null; surface?: number | string | null }): number | null {
  const price = Number(row.price);
  const surface = Number(row.surface);
  return Number.isFinite(price) && Number.isFinite(surface) && price > 0 && surface > 0 ? price / surface : null;
}

export function relativeMarketDifference(price: number | null | undefined, median: number | null | undefined): number | null {
  return price != null && median != null && price > 0 && median > 0 ? price / median - 1 : null;
}

export function communeStreetPrice(statistics: DvfStatistics | null, street: string) {
  return streetMarketPrice(statistics?.streets?.[street]?.residential, statistics?.commune?.residential?.median_price_per_m2, statistics?.commune_weight, statistics?.period, statistics?.max_dispersion_percent);
}

const priceFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const formatReference = (price: number | null) => price === null ? '—' : `${priceFormatter.format(price)} €/m²`;
const formatPeriod = (period?: DvfStatistics['period']) => period
  ? `Période DVF : ${period.from.split('-').reverse().join('/')} – ${period.to.split('-').reverse().join('/')}` : '';

function formatDispersion(sample?: DvfSample, maximum?: number) {
  return `Dispersion : ${sample?.dispersion_percent?.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) ?? '—'}${sample?.dispersion_percent != null ? ' %' : ''}${maximum != null ? ` · seuil ${maximum} %` : ''}`;
}

export function communeMarketTooltip(sample?: DvfSample, period?: DvfStatistics['period'], maximum?: number): DvfTooltip | undefined {
  if (sample?.median_price_per_m2 == null) return undefined;
  return {
    lines: [
      `Médiane classique : ${formatReference(sample.classic_median_price_per_m2 ?? null)}`,
      `Médiane pondérée par l’ancienneté : ${formatReference(sample.median_price_per_m2)}`,
      'Poids communal appliqué : 0 vente équivalente',
      `Ventes DVF retenues : ${sample.sales_count}`,
      formatDispersion(sample, maximum),
      formatPeriod(period),
    ].filter(Boolean),
    reference: `Référence finale : ${formatReference(sample.median_price_per_m2)}`,
  };
}

export function streetMarketPrice(sample: DvfSample | undefined, communeMedian: number | null = null, communeWeight?: number, period?: DvfStatistics['period'], maximum?: number) {
  const salesCount = sample?.sales_count ?? 0;
  const indicative = salesCount > 0 && salesCount < 5;
  const referenceCommune = salesCount === 0 && communeMedian !== null;
  const raw = sample?.raw_median_price_per_m2 ??
    (indicative ? sample?.indicative_median_price_per_m2 ?? null : sample?.median_price_per_m2 ?? null);
  const median = sample?.reference_price_per_m2 ?? (referenceCommune ? communeMedian : raw);
  const weighted = raw !== null && communeMedian !== null && sample?.commune_weight != null;
  const lowReliability = sample?.street_fallback_reason === 'excessive_dispersion' ||
    (sample?.dispersion_percent != null && maximum != null && sample.dispersion_percent > maximum);

  return {
    median,
    difference: salesCount > 0 ? relativeMarketDifference(median, communeMedian) : null,
    tooltip: median === null ? undefined : { lines: [
      `Médiane classique de la rue : ${formatReference(raw)}`,
      `Médiane de rue pondérée par l’ancienneté : ${formatReference(sample?.temporal_median_price_per_m2 ?? null)}`,
      `Médiane communale pondérée par l’ancienneté : ${formatReference(communeMedian)}`,
      `Ventes DVF retenues dans la rue : ${salesCount}`,
      `Poids communal appliqué : ${weighted ? sample?.commune_weight ?? communeWeight : 0} ventes équivalentes`,
      formatDispersion(sample, maximum),
      indicative ? 'Référence indicative : faible échantillon.' : '',
      lowReliability ? 'Faible fiabilité : la dispersion dépasse le seuil.' : '',
      formatPeriod(period),
    ].filter(Boolean), reference: `Référence finale : ${formatReference(median)}` },
    lowReliability,
    indicative,
    referenceCommune,
    salesCount,
    limitedSample: sample?.limited_sample ?? false,
  };
}

export function residentialReference(statistics: DvfStatistics | null, street: string): DvfResidentialReference | null {
  const sample = statistics?.streets?.[street]?.residential;
  return residentialSampleReference(sample, statistics);
}

export function residentialSampleReference(sample: DvfSample | undefined, statistics: DvfStatistics | null): DvfResidentialReference | null {
  const communeMedian = statistics?.commune?.residential?.median_price_per_m2;
  if (sample?.eligible_for_street_comparison && sample.reference_price_per_m2 != null) {
    return {
      median: sample.reference_price_per_m2, scope: 'street',
      tooltip: streetMarketPrice(sample, communeMedian, statistics?.commune_weight, statistics?.period, statistics?.max_dispersion_percent).tooltip,
    };
  }
  const reason = sample?.street_fallback_reason === 'excessive_dispersion' && sample.dispersion_percent != null
    ? `Dispersion excessive : ${sample.dispersion_percent.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} % (maximum ${statistics?.max_dispersion_percent} %)`
    : sample?.street_fallback_reason === 'insufficient_sales' || !sample
      ? `Nombre de ventes insuffisant : ${sample?.sales_count ?? 0}${statistics?.street_min_sales ? ` sur ${statistics.street_min_sales} requises` : ''}`
      : 'Référence de rue indisponible';
  const commune = communeComparisonReference(statistics);
  if (commune?.tooltip) commune.tooltip.lines.unshift(reason);
  return commune;
}

export function communeComparisonReference(statistics: DvfStatistics | null, category: 'residential' | 'apartment' | 'commercial' = 'residential'): DvfResidentialReference | null {
  const sample = statistics?.commune?.[category];
  return sample?.median_price_per_m2 == null ? null : {
    median: sample.median_price_per_m2, scope: 'commune',
    tooltip: communeMarketTooltip(sample, statistics?.period, statistics?.max_dispersion_percent),
  };
}

export function streetComparisonReference(sample: DvfSample | undefined, statistics: DvfStatistics | null, category: 'residential' | 'apartment' | 'commercial' = 'residential'): DvfResidentialReference | null {
  if (sample?.reference_price_per_m2 == null || sample.sales_count === 0) return null;
  const street = streetMarketPrice(sample, statistics?.commune?.[category]?.median_price_per_m2,
    statistics?.commune_weight, statistics?.period, statistics?.max_dispersion_percent);
  return { median: sample.reference_price_per_m2, scope: 'street', tooltip: street.tooltip, lowReliability: street.lowReliability };
}

export function unitDvfCategory(type?: string | null) {
  return type === '2' ? 'apartment' : type === '4' ? 'commercial' : null;
}
