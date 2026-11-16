import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Small helper for vibration/haptics.
// We wrap every call in try/catch so it does not crash in the browser.
@Injectable({
  providedIn: 'root',
})
export class VibrationService {
  // Light tap for small actions like refresh or locate-me.
  async lightTap(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore errors when haptics are not available.
    }
  }

  // Success vibration for things like saving or deleting successfully.
  async success(): Promise<void> {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Ignore errors when haptics are not available.
    }
  }

  // Warning vibration for actions like confirming a delete.
  async warning(): Promise<void> {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      // Ignore errors when haptics are not available.
    }
  }

  // Error vibration for failed actions.
  async error(): Promise<void> {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      // Ignore errors when haptics are not available.
    }
  }
}
