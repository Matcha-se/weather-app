import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

// Small wrapper around Capacitor Preferences.
// We use async methods because Preferences saves data on the device.
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // Read a value and turn it back into an object/array.
  async get<T>(key: string): Promise<T | null> {
    try {
      const saved = await Preferences.get({ key });
      return saved.value ? (JSON.parse(saved.value) as T) : null;
    } catch {
      // If the saved text is broken, just pretend there was nothing.
      return null;
    }
  }

  // Save an object/array as text.
  async set(key: string, value: unknown): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value),
    });
  }

  // Remove one saved value.
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }
}
