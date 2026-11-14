import { Injectable, inject, signal } from '@angular/core';

import type { Place } from '../models/place.model';

import { StorageService } from './storage.service';

const STORAGE_KEY = 'weather-app-places';

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
    // Load the saved list. On the first run, start with Gapan.
    const savedPlaces = this.storage.get<Place[]>(STORAGE_KEY);
    this.placesSignal.set(
      savedPlaces ?? [
        {
          id: 'gapan',
          name: 'Gapan, Nueva Ecija',
          latitude: 15.3078,
          longitude: 120.9464,
        },
      ],
    );
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
    this.save();
    return newPlace;
  }

  updatePlace(updatedPlace: Place): void {
    this.placesSignal.update((places) => places.map((place) => (place.id === updatedPlace.id ? updatedPlace : place)));
    this.save();
  }

  deletePlace(id: string): void {
    this.placesSignal.update((places) => places.filter((place) => place.id !== id));
    this.save();
  }

  private save(): void {
    this.storage.set(STORAGE_KEY, this.placesSignal());
  }
}
