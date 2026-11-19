import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import type { Place } from '../models/place.model';

import { StorageService } from './storage.service';

const STORAGE_KEY = 'places';

// Saved places are created, read, updated and deleted through the REST API.
// Capacitor Preferences is only an offline fallback so the app still works
// when the API is not reachable.
@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly apiUrl = `${environment.apiBaseUrl}/places`;

  // A signal keeps every page in sync. When a place is added or edited,
  // any page reading this signal updates automatically.
  private placesSignal = signal<Place[]>([]);
  readonly places = this.placesSignal.asReadonly();

  // True when the last request fell back to locally cached data.
  offlineMode = false;

  constructor() {
    void this.loadPlaces();
  }

  // READ: GET /api/places. If the API is down, use the offline cache.
  async loadPlaces(): Promise<void> {
    try {
      const places = await firstValueFrom(this.http.get<Place[]>(this.apiUrl));
      this.placesSignal.set(places);
      this.offlineMode = false;
      await this.cachePlaces();
    } catch {
      let cached = await this.storage.get<Place[]>(STORAGE_KEY);

      // First run with no API and no cache: start with two sample places.
      if (!cached || cached.length === 0) {
        cached = this.samplePlaces();
      }

      this.placesSignal.set(cached);
      this.offlineMode = true;
      await this.cachePlaces();
    }
  }

  getPlaces(): Place[] {
    return this.placesSignal();
  }

  getPlace(id: string): Place | undefined {
    return this.placesSignal().find((place) => place.id === id);
  }

  // CREATE: POST /api/places.
  async addPlace(place: Omit<Place, 'id'>): Promise<Place> {
    try {
      const created = await firstValueFrom(this.http.post<Place>(this.apiUrl, place));
      this.placesSignal.update((places) => [...places, created]);
      this.offlineMode = false;
      await this.cachePlaces();
      return created;
    } catch {
      // Offline fallback: keep the data on the device.
      const created: Place = { ...place, id: `local-${Date.now()}` };
      this.placesSignal.update((places) => [...places, created]);
      this.offlineMode = true;
      await this.cachePlaces();
      return created;
    }
  }

  // UPDATE: PUT /api/places/:id.
  async updatePlace(updatedPlace: Place): Promise<void> {
    try {
      const updated = await firstValueFrom(this.http.put<Place>(`${this.apiUrl}/${updatedPlace.id}`, updatedPlace));
      this.placesSignal.update((places) => places.map((place) => (place.id === updated.id ? updated : place)));
      this.offlineMode = false;
    } catch {
      this.placesSignal.update((places) =>
        places.map((place) => (place.id === updatedPlace.id ? updatedPlace : place)),
      );
      this.offlineMode = true;
    }
    await this.cachePlaces();
  }

  // DELETE: DELETE /api/places/:id.
  async deletePlace(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
      this.placesSignal.update((places) => places.filter((place) => place.id !== id));
      this.offlineMode = false;
    } catch {
      this.placesSignal.update((places) => places.filter((place) => place.id !== id));
      this.offlineMode = true;
    }
    await this.cachePlaces();
  }

  private async cachePlaces(): Promise<void> {
    await this.storage.set(STORAGE_KEY, this.placesSignal());
  }

  private samplePlaces(): Place[] {
    return [
      {
        id: 'gapan',
        name: 'Gapan, Nueva Ecija',
        note: 'My hometown',
        latitude: 15.3071,
        longitude: 120.9467,
      },
      {
        id: 'cabanatuan',
        name: 'Cabanatuan City, Nueva Ecija',
        note: 'Nearby city',
        latitude: 15.4865,
        longitude: 120.9734,
      },
    ];
  }
}
