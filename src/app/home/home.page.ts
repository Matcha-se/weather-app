import { Component, inject } from '@angular/core';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToolbar,
} from '@ionic/angular';

import type { Place } from '../models/place.model';
import type { ForecastDay, Weather, WeatherCondition } from '../models/weather.model';
import { LocationService } from '../services/location.service';
import { PlacesService } from '../services/places.service';
import { VibrationService } from '../services/vibration.service';
import { WeatherService } from '../services/weather.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
  ],
})
export class HomePage {
  private readonly weatherService = inject(WeatherService);
  private readonly locationService = inject(LocationService);
  private readonly placesService = inject(PlacesService);
  private readonly vibrationService = inject(VibrationService);
  private readonly actionSheetController = inject(ActionSheetController);

  weather: Weather | null = null;
  forecast: ForecastDay[] = [];
  updatedLabel = '';

  isLoading = false;
  errorMessage = '';
  fallbackMessage = '';
  offlineMessage = '';
  showOfflineBanner = false;

  // null means "My Location" (GPS). A saved place means show weather for that place.
  selectedPlace: Place | null = null;
  selectedLocationLabel = 'My Location';

  // Used to ignore old weather responses when a newer load starts.
  private loadRequestId = 0;

  // Refresh data automatically when Home is opened or revisited.
  async ionViewWillEnter(): Promise<void> {
    await this.placesService.loadPlaces();

    // If the selected saved place was deleted, go back to My Location.
    if (this.selectedPlace) {
      const updatedPlace = this.placesService.getPlace(this.selectedPlace.id);
      if (!updatedPlace) {
        this.selectedPlace = null;
        this.selectedLocationLabel = 'My Location';
      } else {
        this.selectedPlace = updatedPlace;
        this.selectedLocationLabel = updatedPlace.name;
      }
    }

    await this.loadWeather();
  }

  // Refresh button tap. Clicks are vibrated by the global click handler.
  async refreshWeather(): Promise<void> {
    await this.loadWeather();
  }

  // Pull-to-refresh action.
  async handleRefresh(event: any): Promise<void> {
    await this.loadWeather(true);
    event.target.complete();
  }

  // Open a picker to choose My Location or a saved place.
  async chooseLocation(): Promise<void> {
    const savedPlaces = this.placesService.getPlaces();

    const buttons = [
      {
        text: 'My Location',
        handler: async () => {
          this.selectedPlace = null;
          this.selectedLocationLabel = 'My Location';
          await this.loadWeather();
        },
      },
      ...savedPlaces.map((place) => ({
        text: place.name,
        handler: async () => {
          this.selectedPlace = place;
          this.selectedLocationLabel = place.name;
          await this.loadWeather();
        },
      })),
      {
        text: 'Cancel',
        role: 'cancel' as const,
      },
    ];

    const actionSheet = await this.actionSheetController.create({
      header: 'Choose location',
      buttons,
    });

    await actionSheet.present();
  }

  async loadWeather(isRefresh = false): Promise<void> {
    const requestId = ++this.loadRequestId;

    if (!isRefresh) {
      this.isLoading = true;
    }

    this.errorMessage = '';
    this.fallbackMessage = '';
    this.offlineMessage = '';
    this.showOfflineBanner = false;

    try {
      let latitude: number;
      let longitude: number;
      let placeName: string;

      if (this.selectedPlace) {
        // Show weather for the selected saved place.
        latitude = this.selectedPlace.latitude;
        longitude = this.selectedPlace.longitude;
        placeName = this.selectedPlace.name;
      } else {
        // Get the device location first. If denied or unavailable, use Gapan.
        const location = await this.locationService.getCurrentLocation();
        latitude = location.latitude;
        longitude = location.longitude;
        placeName = location.usedFallback ? 'Gapan, Nueva Ecija' : 'My Location';

        if (location.usedFallback) {
          this.fallbackMessage = 'Location not available. Showing weather for Gapan.';
        }
      }

      const result = await this.weatherService.getWeather(latitude, longitude, placeName);

      // If another load started after this one, ignore this old result.
      if (requestId !== this.loadRequestId) {
        return;
      }

      this.weather = result.weather;
      this.forecast = result.forecast;

      // Save fresh data for offline use.
      const updatedAt = await this.weatherService.saveCache(this.weather, this.forecast);
      this.setUpdatedLabel(updatedAt);
    } catch {
      // If another load started after this one, ignore this old error.
      if (requestId !== this.loadRequestId) {
        return;
      }

      // If loading fails, try to show the last saved weather.
      await this.vibrationService.error();

      const cache = await this.weatherService.loadCache();
      if (requestId !== this.loadRequestId) {
        return;
      }

      if (cache) {
        this.weather = cache.weather;
        this.forecast = cache.forecast;
        this.setUpdatedLabel(cache.updatedAt);
        this.offlineMessage = 'Offline: showing last saved weather from ' + this.formatCacheDate(cache.updatedAt);
        this.showOfflineBanner = true;
      } else {
        this.weather = null;
        this.forecast = [];
        this.errorMessage = 'Could not load weather right now.';
      }
    } finally {
      // Only the latest load should turn off the loading state.
      if (requestId === this.loadRequestId) {
        this.isLoading = false;
      }
    }
  }

  // Turn a condition into an image from assets/icons/weather.
  iconFor(condition: WeatherCondition): string {
    return this.weatherService.getIcon(condition);
  }

  private setUpdatedLabel(dateValue: string): void {
    const date = new Date(dateValue);
    this.updatedLabel = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatCacheDate(dateValue: string): string {
    const date = new Date(dateValue);
    return date.toLocaleString();
  }
}
