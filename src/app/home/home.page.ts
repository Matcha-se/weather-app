import { Component, inject } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonToolbar } from '@ionic/angular';

import type { ForecastDay, Weather, WeatherCondition } from '../models/weather.model';
import { WeatherService } from '../services/weather.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent],
})
export class HomePage {
  private readonly weatherService = inject(WeatherService);

  weather: Weather;
  forecast: ForecastDay[];
  updatedLabel = '';

  constructor() {
    this.weather = this.weatherService.getCurrentWeather();
    this.forecast = this.weatherService.getForecast();
    this.setUpdatedLabel();
  }

  // For now this just reloads the mock data.
  // Later you can call a real weather API here.
  refreshWeather(): void {
    this.weather = this.weatherService.getCurrentWeather(this.weather.placeName);
    this.forecast = this.weatherService.getForecast();
    this.setUpdatedLabel();
  }

  // Turn a condition such as "rainy" into an image from assets/icons/weather.
  iconFor(condition: WeatherCondition): string {
    return this.weatherService.getIcon(condition);
  }

  private setUpdatedLabel(): void {
    this.updatedLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
