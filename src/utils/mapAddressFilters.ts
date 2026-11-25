function normalizeStreet(value?: string | null) {
  return (value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const normalizeStreetCode = (value?: string | number | null) => String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const dvfRollingRanges = [[1, '1y'], [2, '2y'], [3, '3y'], [5, '5y']] as const;

export function dvfRangeForSale(saleDate: string, today = new Date()) {
  const date = new Date(`${saleDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== saleDate ||
    saleDate > today.toISOString().slice(0, 10)) return null;

  for (const [years, range] of dvfRollingRanges) {
    const cutoff = new Date(today);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
    if (saleDate >= cutoff.toISOString().slice(0, 10)) return range;
  }

  return saleDate >= '2020-01-01' ? 'since2020' : 'all';
}

export function matchesDpeStreet(
  result: { identifiant_ban?: string | null; nom_rue_ban?: string | null },
  streetId: string,
  streetName?: string
) {
  const addressStreetId = result.identifiant_ban?.match(/^([^_]+_[^_]+)_/)?.[1];
  return normalizeStreetCode(addressStreetId) === normalizeStreetCode(streetId) ||
    (!!streetName && normalizeStreet(result.nom_rue_ban) === normalizeStreet(streetName));
}

type SaleAddress = {
  adresse?: string;
  adresse_numero?: string | number | null;
  adresse_suffixe?: string | null;
  adresse_code_voie?: string | number | null;
  adresse_type_voie?: string | null;
  adresse_nom_voie?: string | null;
};

export function dvfSaleKey(sale: SaleAddress & {
  id_mutation?: string;
  numero_disposition?: number | null;
  valeur_fonciere?: number | null;
}): string {
  if (sale.id_mutation?.startsWith('HIST-')) {
    return JSON.stringify([sale.id_mutation, sale.numero_disposition, sale.valeur_fonciere, sale.adresse]);
  }
  return JSON.stringify([sale.id_mutation, sale.numero_disposition]);
}

export function matchesHistoricalStreet(sale: SaleAddress, streetId: string, streetName?: string) {
  const code = normalizeStreetCode(sale.adresse_code_voie);
  const selected = normalizeStreetCode(streetId);
  if (code && (code === selected || (code.length === 4 && selected.slice(5) === code))) return true;
  const name = [sale.adresse_type_voie, sale.adresse_nom_voie].filter(Boolean).join(' ');
  return !!streetName && normalizeStreet(name) === normalizeStreet(streetName);
}

function normalizeSuffix(value?: string | null) {
  const suffix = value?.trim().toLowerCase() ?? '';
  if (suffix === 'bis') return 'b';
  if (suffix === 'ter') return 't';
  if (suffix === 'quater') return 'q';
  return suffix;
}

export function matchesSaleNumber(sale: SaleAddress, numero: string, rep: string) {
  // Recent DVF responses expose the representative address as a label.
  const address = sale.adresse?.trim().match(/^(\d+)(?:\s*(bis|ter|quater|[a-z])(?=\s|$))?(?=\s|$)/i);
  const number = sale.adresse_numero ?? address?.[1];
  const suffix = sale.adresse_numero != null ? sale.adresse_suffixe : address?.[2];
  return number != null && /^\d+$/.test(String(number).trim()) &&
    Number(number) === Number(numero) && normalizeSuffix(suffix) === normalizeSuffix(rep);
}
