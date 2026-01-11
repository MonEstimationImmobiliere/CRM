// filepath: /Users/yogann-henry/Documents/Develop/Projets-Perso/CRM_V2/CRM/src/types/reminder.ts

/**
 * Types de rappels disponibles
 */
export type ReminderType = 'rappel' | 'estimation' | 'visite' | 'autre';

/**
 * Niveaux de priorité des rappels
 */
export type ReminderPriority = 'low' | 'medium' | 'high';

/**
 * Interface pour les données d'un rappel (Reminder)
 * Utilisé pour les endpoints /reminders/user et /reminders/agency
 */
export interface IReminder {
  id: number;
  property_id: number;
  created_by: number;
  updated_by: number;
  title: string;
  description: string | null;
  date: string;
  type: ReminderType;
  priority: ReminderPriority;
  completed: boolean;
  sharing: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface pour la création d'un rappel
 */
export interface IReminderCreate {
  property_id: number;
  title: string;
  description?: string | null;
  date: string;
  type: ReminderType;
  priority: ReminderPriority;
  completed?: boolean;
  sharing?: boolean;
}

/**
 * Interface pour la mise à jour d'un rappel
 */
export interface IReminderUpdate extends Partial<IReminderCreate> {
  id: number;
}

/**
 * Type pour les listes de rappels (user ou agency)
 */
export type ReminderList = IReminder[];
