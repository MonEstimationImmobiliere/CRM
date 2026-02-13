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
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
