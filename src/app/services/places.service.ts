import { Injectable, inject, signal } from '@angular/core';

import type { Place } from '../models/place.model';

import { StorageService } from './storage.service';

const STORAGE_KEY = 'places';

// Keeps the list of saved places and remembers it between app visits.
@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private readonly storage = inject(StorageService);

  // A signal keeps every page in sync. When a place is added or edited,
  // any page reading this signal updates automatically.
  private placesSignal = signal<Place[]>([]);
  readonly places = this.placesSignal.asReadonly();

  constructor() {
    // Load saved places when the app starts.
    void this.loadPlaces();
  }

  // Load places from Capacitor Preferences.
  // On the first run, start with 2 sample places.
  async loadPlaces(): Promise<void> {
    const savedPlaces = await this.storage.get<Place[]>(STORAGE_KEY);

    if (savedPlaces && savedPlaces.length > 0) {
      this.placesSignal.set(savedPlaces);
      return;
    }

    const samplePlaces: Place[] = [
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

    this.placesSignal.set(samplePlaces);
    await this.storage.set(STORAGE_KEY, samplePlaces);
  }

  getPlaces(): Place[] {
    return this.placesSignal();
  }

  getPlace(id: string): Place | undefined {
    return this.placesSignal().find((place) => place.id === id);
  }

  addPlace(place: Omit<Place, 'id'>): Place {
    // Date.now() is good enough for a beginner project.
    const newPlace: Place = { ...place, id: Date.now().toString() };
    this.placesSignal.update((places) => [...places, newPlace]);
    void this.save();
    return newPlace;
  }

  updatePlace(updatedPlace: Place): void {
    this.placesSignal.update((places) => places.map((place) => (place.id === updatedPlace.id ? updatedPlace : place)));
    void this.save();
  }

  deletePlace(id: string): void {
    this.placesSignal.update((places) => places.filter((place) => place.id !== id));
    void this.save();
  }

  private async save(): Promise<void> {
    await this.storage.set(STORAGE_KEY, this.placesSignal());
  }
}
