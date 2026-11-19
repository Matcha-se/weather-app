import { Injectable } from '@angular/core';
import { Haptics } from '@capacitor/haptics';

// Elements that count as a "button tap" for global haptic feedback.
const INTERACTIVE_SELECTOR = [
  'button',
  'ion-button',
  'ion-tab-button',
  'ion-back-button',
  'ion-item-option',
  'ion-select',
  'ion-checkbox',
  'ion-toggle',
  'ion-radio',
  'ion-segment-button',
  'a',
  '[role="button"]',
].join(', ');

// Small helper for vibration/haptics.
// Every call is wrapped in try/catch so it does not crash in the browser.
@Injectable({
  providedIn: 'root',
})
export class VibrationService {
  // Used so a click that already has stronger feedback does not buzz twice.
  private lastStrongFeedbackAt = 0;

  // Called by the root component for every click in the app.
  onClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(INTERACTIVE_SELECTOR)) {
      return;
    }

    // Defer so a button's own success/warning/error feedback can claim the
    // click first. Otherwise the button would buzz twice.
    setTimeout(() => {
      if (Date.now() - this.lastStrongFeedbackAt < 300) {
        return;
      }
      void this.lightTap();
    }, 0);
  }

  // Short tap for ordinary button clicks (tab bar, toolbar, forms, etc.).
  async lightTap(): Promise<void> {
    await this.buzz(150);
  }

  // Success vibration for things like saving or deleting successfully.
  async success(): Promise<void> {
    this.markStrongFeedback();
    await this.buzz(350);
  }

  // Warning vibration for actions like confirming a delete.
  async warning(): Promise<void> {
    this.markStrongFeedback();
    await this.buzz(600);
  }

  // Error vibration for failed actions.
  async error(): Promise<void> {
    this.markStrongFeedback();
    await this.buzz(800);
  }

  private markStrongFeedback(): void {
    this.lastStrongFeedbackAt = Date.now();
  }

  private async buzz(duration: number): Promise<void> {
    try {
      await Haptics.vibrate({ duration });
    } catch {
      // Ignore errors when haptics are not available.
    }
  }
}
