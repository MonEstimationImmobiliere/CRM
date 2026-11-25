import { PropertyService } from '@/api/property.service';
import { getPersonalPropertyTarget, personalPropertyKey } from '@/api/personal-property.service';
import type { IAddressDetail } from '@/types/address';
import { prospectionAddressKey } from '@/utils/prospectionProgress';

type FavoriteLookupRow = Partial<IAddressDetail> & { id_fantoir_defaut?: string | null };

export async function loadFavoriteAddressDetails(row: FavoriteLookupRow) {
  const target = getPersonalPropertyTarget(row);
  const street = row.prospection_street_key || row.id_fantoir_defaut || row.id_fantoir;
  if (!target || target.bien_type === 'custom_property' || !street || !row.code_insee ||
      !row.numero || row.numero === '99999') return [];

  const rows = await PropertyService.getAddressesByFantoir(
    street, 'address', row.numero, row.rep ?? '', true, row.code_insee
  );
  const targetKey = personalPropertyKey(target);
  const selected = rows.find(candidate => {
    const identity = getPersonalPropertyTarget(candidate);
    return identity && personalPropertyKey(identity) === targetKey;
  });
  const key = selected && prospectionAddressKey(selected);
  return key ? rows.filter(candidate => prospectionAddressKey(candidate) === key) : [];
}
