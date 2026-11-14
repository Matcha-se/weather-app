import { Injectable } from '@angular/core';

// Small wrapper around localStorage.
// We use localStorage so the project stays simple and needs no extra plugins.
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // Read a value and turn it back into an object/array.
  get<T>(key: string): T | null {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : null;
    } catch {
      // If the saved text is broken, just pretend there was nothing.
      return null;
    }
  }

  // Save an object/array as text.
  set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Remove one saved value.
  remove(key: string): void {
    localStorage.removeItem(key);
  }
}
