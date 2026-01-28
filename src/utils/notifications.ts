/**
 * Notification service for the CRM application
 * Provides consistent notifications across the app
 */

import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import type { NotificationOptions } from 'element-plus';

export type NotificationType = 'success' | 'warning' | 'info' | 'error';

export interface CustomNotificationOptions extends Partial<NotificationOptions> {
  type?: NotificationType;
  duration?: number;
  showClose?: boolean;
}

export class NotificationService {
  // Default configurations
  private static readonly DEFAULT_DURATION = 3000;
  private static readonly DEFAULT_POSITION = 'top-right';

  /**
   * Show a simple message
   */
  static message(
    message: string,
    type: NotificationType = 'info',
    duration?: number
  ) {
    ElMessage({
      message,
      type,
      duration: duration || this.DEFAULT_DURATION,
      showClose: true,
    });
  }

  /**
   * Show a success message
   */
  static success(message: string, duration?: number) {
    this.message(message, 'success', duration);
  }

  /**
   * Show an error message
   */
  static error(message: string, duration?: number) {
    this.message(message, 'error', duration || 5000); // Errors stay longer
  }

  /**
   * Show a warning message
   */
  static warning(message: string, duration?: number) {
    this.message(message, 'warning', duration);
  }

  /**
   * Show an info message
   */
  static info(message: string, duration?: number) {
    this.message(message, 'info', duration);
  }

  /**
   * Show a detailed notification
   */
  static notify(
    title: string,
    message?: string,
    options?: CustomNotificationOptions
  ) {
    ElNotification({
      title,
      message,
      type: options?.type || 'info',
      duration: options?.duration || this.DEFAULT_DURATION,
      position: this.DEFAULT_POSITION,
      showClose: options?.showClose !== false,
      ...options,
    });
  }

  /**
   * Show a success notification
   */
  static notifySuccess(
    title: string,
    message?: string,
    options?: CustomNotificationOptions
  ) {
    this.notify(title, message, { ...options, type: 'success' });
  }

  /**
   * Show an error notification
   */
  static notifyError(
    title: string,
    message?: string,
    options?: CustomNotificationOptions
  ) {
    this.notify(title, message, {
      ...options,
      type: 'error',
      duration: options?.duration || 5000,
    });
  }

  /**
   * Show a warning notification
   */
  static notifyWarning(
    title: string,
    message?: string,
    options?: CustomNotificationOptions
  ) {
    this.notify(title, message, { ...options, type: 'warning' });
  }

  /**
   * Show an info notification
   */
  static notifyInfo(
    title: string,
    message?: string,
    options?: CustomNotificationOptions
  ) {
    this.notify(title, message, { ...options, type: 'info' });
  }

  /**
   * Show a confirmation dialog
   */
  static async confirm(
    message: string,
    title: string = 'Confirmation',
    confirmText: string = 'Confirmer',
    cancelText: string = 'Annuler'
  ): Promise<boolean> {
    try {
      await ElMessageBox.confirm(message, title, {
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        type: 'warning',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Show an input dialog
   */
  static async prompt(
    message: string,
    title: string = 'Saisie',
    inputValue: string = '',
    inputPlaceholder: string = ''
  ): Promise<string | null> {
    try {
      const { value } = await ElMessageBox.prompt(message, title, {
        confirmButtonText: 'Confirmer',
        cancelButtonText: 'Annuler',
        inputValue,
        inputPlaceholder,
      });
      return value as string;
    } catch {
      return null;
    }
  }

  /**
   * Show reminder-specific notifications
   */
  static reminderCreated(title: string) {
    this.notifySuccess('Rappel créé', `"${title}" a été ajouté à vos rappels`, {
      duration: 4000,
    });
  }

  static reminderUpdated(title: string) {
    this.notifySuccess('Rappel modifié', `"${title}" a été mis à jour`, {
      duration: 3000,
    });
  }

  static reminderDeleted(title: string) {
    this.notifyInfo('Rappel supprimé', `"${title}" a été supprimé`, {
      duration: 3000,
    });
  }

  static reminderCompleted(title: string) {
    this.notifySuccess(
      'Rappel terminé',
      `"${title}" est marqué comme terminé`,
      {
        duration: 3000,
      }
    );
  }

  /**
   * Show property-specific notifications
   */
  static propertyCreated(address: string) {
    this.notifySuccess(
      'Propriété créée',
      `${address} a été ajoutée à votre portfolio`,
      {
        duration: 4000,
      }
    );
  }

  static propertyUpdated(address: string) {
    this.notifySuccess('Propriété mise à jour', `${address} a été modifiée`, {
      duration: 3000,
    });
  }

  static propertyDeleted(address: string) {
    this.notifyInfo('Propriété supprimée', `${address} a été supprimée`, {
      duration: 3000,
    });
  }

  /**
   * Show system notifications
   */
  static dataLoaded(message: string = 'Données chargées avec succès') {
    this.success(message, 2000);
  }

  static dataSaved(message: string = 'Données sauvegardées') {
    this.success(message, 2000);
  }

  static networkError(
    message: string = 'Erreur de connexion. Veuillez réessayer.'
  ) {
    this.error(message, 5000);
  }

  static validationError(
    message: string = 'Veuillez vérifier les champs saisis'
  ) {
    this.warning(message, 4000);
  }
}
