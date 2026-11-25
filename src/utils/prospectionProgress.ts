export interface ProspectionCount {
  prospected: number;
  total: number;
}

export interface ProspectionProgress {
  commune: ProspectionCount;
  streets: Record<string, ProspectionCount>;
  addresses: Record<string, ProspectionCount>;
  bien_status: Record<string, boolean>;
  server_now: string;
  next_expiry: string | null;
}

interface ProgressRow {
  id_fantoir_long?: string;
  id_fantoir?: string;
  total_adresses?: number;
  prospection_address_key?: string | null;
  row_type?: string;
  unit_id?: string | number | null;
  bien_type?: string;
  bien_key?: string;
}

interface MapAddressRow extends ProgressRow {
  code_insee?: string;
  nom_commune?: string;
  code_postal?: string;
  nom_voie?: string;
  numero?: string | number;
  rep?: string | null;
  prospection_street_key?: string | null;
}

export interface ProspectionMapSelection {
  addressKey: string;
  codeInsee: string;
  cityName: string;
  postalCode?: string;
  streetKey: string;
  streetName: string;
  numero: string;
  rep: string;
}

const emptyCount: ProspectionCount = { prospected: 0, total: 0 };
const percentFormatter = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });

export function prospectionAddressKey(row: ProgressRow): string | null {
  return row.prospection_address_key === null
    ? null
    : row.prospection_address_key || row.id_fantoir_long || null;
}

export function uniqueProspectionAddressKey(
  rows: (ProgressRow & { numero?: string | number; rep?: string | null })[],
  numero: string,
  rep: string
): string | null {
  const number = numero.trim();
  if (!number) return null;
  const suffix = rep.trim().toLowerCase();
  const keys = new Set<string>();

  for (const row of rows) {
    if (String(row.numero ?? '').trim() !== number || (row.rep ?? '').trim().toLowerCase() !== suffix) continue;
    const key = prospectionAddressKey(row);
    if (key) keys.add(key);
    if (keys.size > 1) return null;
  }

  return keys.values().next().value ?? null;
}

export function prospectionRowKey(row: ProgressRow): string {
  if (row.total_adresses !== undefined) return `street:${row.id_fantoir ?? ''}`;
  const key = prospectionAddressKey(row);
  return key ? `address:${key}` : '';
}

export function prospectionAddressRepresentative<T extends ProgressRow>(rows: T[], key: string): T | undefined {
  const matching = rows.filter(row => row.total_adresses === undefined && prospectionAddressKey(row) === key);
  return matching.find(row => row.row_type !== 'unit' && !(Number(row.unit_id) > 0)) ?? matching[0];
}

export function resolveProspectionMapSelection(
  rows: MapAddressRow[],
  address: MapAddressRow
): ProspectionMapSelection | null {
  const addressKey = prospectionAddressKey(address);
  const codeInsee = address.code_insee?.trim();
  const cityName = address.nom_commune?.trim();
  const streetKey = (address.prospection_street_key || address.id_fantoir)?.trim();
  const streetName = address.nom_voie?.trim();
  const numero = String(address.numero ?? '').trim();
  const rep = (address.rep ?? '').trim();
  if (!addressKey || !codeInsee || !cityName || !streetKey || !streetName || !numero || numero === '99999') {
    return null;
  }

  const streetRows = rows.filter(row => row.code_insee === codeInsee &&
    (row.prospection_street_key || row.id_fantoir) === streetKey);
  if (uniqueProspectionAddressKey(streetRows, numero, rep) !== addressKey) return null;

  return {
    addressKey, codeInsee, cityName, streetKey, streetName, numero, rep,
    postalCode: address.code_postal?.trim(),
  };
}

export function rowProspectionCount(progress: ProspectionProgress | null, row: ProgressRow) {
  if (!progress) return null;
  if (row.total_adresses !== undefined) return progress.streets[row.id_fantoir ?? ''] ?? emptyCount;
  const key = prospectionAddressKey(row);
  return key ? progress.addresses[key] ?? emptyCount : null;
}

export function countProspectionStreets(
  rows: (ProgressRow & { nom_voie?: string | null })[],
  progress: ProspectionProgress | null
): number | null {
  if (!progress) return null;
  const streets = new Set<string>();
  for (const row of rows) {
    const key = row.id_fantoir;
    const name = row.nom_voie?.trim();
    if (row.total_adresses !== undefined && key && name && !/\bvoie fictive\b/i.test(name) &&
        (progress.streets[key]?.total ?? 0) > 0) {
      streets.add(key);
    }
  }
  return streets.size;
}

function tableBienKey(row: ProgressRow): string | null {
  if (row.bien_type === 'custom_property') return null;
  if (row.row_type === 'estimation' && !(row.bien_type && row.bien_key)) return null;
  const unitId = String(row.bien_type === 'unit' ? row.bien_key ?? row.unit_id ?? '' : row.unit_id ?? '');
  if (/^[1-9]\d*$/.test(unitId)) return `unit:${unitId}`;
  if (row.row_type === 'unit' || row.bien_type === 'unit') return null;
  const address = row.bien_type === 'address' ? row.bien_key ?? row.id_fantoir_long : row.id_fantoir_long;
  return address ? `address:${address}` : null;
}

export function tableRowProgressLookupKey(row: ProgressRow): string | null {
  const key = tableBienKey(row);
  if (!key) return null;
  if (row.prospection_address_key !== undefined) return row.prospection_address_key;
  if (row.bien_type === 'address' && row.bien_key) return row.bien_key;
  return prospectionAddressKey(row) ?? (key.startsWith('unit:') ? key : row.bien_key ?? null);
}

export function tableRowProspectionCount(progress: ProspectionProgress | null, row: ProgressRow) {
  if (!progress) return null;
  if (row.total_adresses !== undefined) return rowProspectionCount(progress, row);
  const key = tableBienKey(row);
  if (!key) return null;
  const status = progress.bien_status[key];
  return typeof status === 'boolean' ? { prospected: Number(status), total: 1 } : null;
}

export function prospectionRatio(count?: ProspectionCount | null) {
  return count && count.total > 0 ? Math.min(1, Math.max(0, count.prospected / count.total)) : 0;
}

export function prospectionPercent(count?: ProspectionCount | null) {
  const ratio = prospectionRatio(count);
  if (ratio === 0 || ratio === 1) return `${ratio * 100} %`;
  if (ratio < 0.0005) return '< 0,1 %';
  if (ratio >= 0.9995) return '> 99,9 %';
  return percentFormatter.format(ratio);
}

export function prospectionColor(count?: ProspectionCount | null) {
  const ratio = prospectionRatio(count);
  if (ratio === 0) return '#9ca3af';
  const light = [134, 239, 172];
  const dark = [21, 128, 61];
  return `rgb(${light.map((channel, index) => Math.round(channel + (dark[index] - channel) * ratio)).join(', ')})`;
}
