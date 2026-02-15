import { useDashboardStore } from '@/stores/dashboard';

/**
 * Utilitaires partagés pour les propriétés (tags, ville, etc.).
 * Utilisés dans FavoritesCards, FavoritesTable, et potentiellement d'autres composants.
 */

/** Retourne le type de tag Element Plus selon le type de propriété */
export function getPropertyTypeTagType(
  propertyType: string | undefined
): '' | 'success' | 'info' | 'warning' | 'danger' {
  if (!propertyType) return '';

  switch (propertyType.toLowerCase()) {
    case 'maison':
      return 'success';
    case 'appartement':
      return 'info';
    case 'immeuble':
      return 'warning';
    case 'terrain':
      return 'danger';
    default:
      return '';
  }
}

/** Retourne la ville d'une propriété avec fallback sur la ville sélectionnée dans le dashboard */
export function getPropertyCity(property: {
  city?: string | null;
  [key: string]: unknown;
}): string {
  if (property.city) return property.city;

  const dashboardStore = useDashboardStore();
  const selectedCity = dashboardStore.selectedCity as Record<
    string,
    unknown
  > | null;

  return (selectedCity?.city as string) || 'Non renseigné';
}
