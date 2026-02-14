import { formatDateFull } from '@/helpers/intl';

/**
 * Utilitaires partagés pour les rappels (labels, couleurs, formatage de dates).
 * Utilisés dans PropertyDialog, PropertyReminderList, Reminders.vue, etc.
 */

export type PriorityType = 'success' | 'warning' | 'danger' | 'info';
export type ReminderTypeColor = 'success' | 'warning' | 'danger' | 'info';

/** Couleur Element Plus pour une priorité donnée */
export function getPriorityType(priority: string): PriorityType {
  const types: Record<string, PriorityType> = {
    high: 'danger',
    medium: 'warning',
    low: 'info',
  };
  return types[priority] || 'info';
}

/** Label français pour une priorité */
export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
  };
  return labels[priority] || priority;
}

/** Couleur Element Plus pour un type de rappel */
export function getTypeColor(type: string): ReminderTypeColor {
  const colors: Record<string, ReminderTypeColor> = {
    rappel: 'info',
    estimation: 'success',
    visite: 'warning',
    autre: 'info',
  };
  return colors[type] || 'info';
}

/** Label français pour un type de rappel */
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    rappel: 'Rappel',
    estimation: 'Estimation',
    visite: 'Visite',
    autre: 'Autre',
  };
  return labels[type] || type;
}

/** Formate une date ISO en texte long français (ex: "lundi 3 mars 2025") */
export function formatReminderDate(dateString: string): string {
  return formatDateFull(dateString);
}

/** Retourne true si la date du rappel est avant aujourd'hui et non complété */
export function isOverdue(date: string, completed: boolean): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date < today && !completed;
}

/** Retourne true si la date du rappel est aujourd'hui */
export function isToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
}

/** Ordre de priorité pour le tri (high = 3, medium = 2, low = 1) */
const PRIORITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

/**
 * Trie un tableau de rappels par date puis par priorité.
 * @param reminders  tableau de rappels
 * @param dateOrder  'asc' (plus ancien d'abord) ou 'desc' (plus récent d'abord)
 */
export function sortReminders<T extends { date: string; priority: string }>(
  reminders: T[],
  dateOrder: 'asc' | 'desc' = 'asc'
): T[] {
  return [...reminders].sort((a, b) => {
    if (a.date !== b.date) {
      const cmp = a.date.localeCompare(b.date);
      return dateOrder === 'asc' ? cmp : -cmp;
    }
    return (
      ()
    
      (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0)
    );
  });
}
