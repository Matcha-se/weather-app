import { Component, OnInit, inject } from '@angular/core';
import {
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

import type { ForecastDay, Weather, WeatherCondition } from '../models/weather.model';
import { LocationService } from '../services/location.service';
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
export class HomePage implements OnInit {
  private readonly weatherService = inject(WeatherService);
  private readonly locationService = inject(LocationService);
  private readonly vibrationService = inject(VibrationService);

  weather: Weather | null = null;
  forecast: ForecastDay[] = [];
  updatedLabel = '';

  isLoading = false;
  errorMessage = '';
  fallbackMessage = '';
  offlineMessage = '';
  showOfflineBanner = false;

  async ngOnInit(): Promise<void> {
    await this.loadWeather();
  }

  // Refresh button tap.
  async refreshWeather(): Promise<void> {
    await this.vibrationService.lightTap();
    await this.loadWeather();
  }

  // Pull-to-refresh action.
  async handleRefresh(event: any): Promise<void> {
    await this.vibrationService.lightTap();
    await this.loadWeather(true);
    event.target.complete();
  }

  async loadWeather(isRefresh = false): Promise<void> {
    if (!isRefresh) {
      this.isLoading = true;
    }

    this.errorMessage = '';
    this.fallbackMessage = '';
    this.offlineMessage = '';
    this.showOfflineBanner = false;

    try {
      // Get the device location first. If denied or unavailable, use Gapan.
      const location = await this.locationService.getCurrentLocation();
      const placeName = location.usedFallback ? 'Gapan, Nueva Ecija' : 'My Location';

      if (location.usedFallback) {
        this.fallbackMessage = 'Location not available. Showing weather for Gapan.';
      }

      const result = await this.weatherService.getWeather(
        location.latitude,
        location.longitude,
        placeName,
      );

      this.weather = result.weather;
      this.forecast = result.forecast;

      // Save fresh data for offline use.
      const updatedAt = await this.weatherService.saveCache(this.weather, this.forecast);
      this.setUpdatedLabel(updatedAt);
    } catch {
      // If loading fails, try to show the last saved weather.
      await this.vibrationService.error();

      const cache = await this.weatherService.loadCache();
      if (cache) {
        this.weather = cache.weather;
        this.forecast = cache.forecast;
        this.setUpdatedLabel(cache.updatedAt);
        this.offlineMessage =
          'Offline: showing last saved weather from ' + this.formatCacheDate(cache.updatedAt);
        this.showOfflineBanner = true;
      } else {
        this.weather = null;
        this.forecast = [];
        this.errorMessage = 'Could not load weather right now.';
      }
    } finally {
      this.isLoading = false;
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
