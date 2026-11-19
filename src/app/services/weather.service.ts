import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import type { ForecastDay, Weather, WeatherCondition } from '../models/weather.model';

import { StorageService } from './storage.service';

// This is what we save for offline use.
export interface WeatherCache {
  weather: Weather;
  forecast: ForecastDay[];
  updatedAt: string;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

const CACHE_KEY = 'weather-cache';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  // Get weather from Open-Meteo using latitude and longitude.
  async getWeather(
    latitude: number,
    longitude: number,
    placeName: string,
  ): Promise<{ weather: Weather; forecast: ForecastDay[] }> {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${latitude}&longitude=${longitude}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&timezone=auto';

    // Add a timeout so the request does not hang forever.
    const data = await firstValueFrom(this.http.get<OpenMeteoResponse>(url).pipe(timeout(12000)));

    const weather: Weather = {
      placeName,
      temperature: Math.round(data.current.temperature_2m),
      condition: this.mapCondition(data.current.weather_code),
      conditionLabel: this.getConditionLabel(this.mapCondition(data.current.weather_code)),
      humidity: Math.round(data.current.relative_humidity_2m),
      windSpeed: Math.round(data.current.wind_speed_10m),
      feelsLike: Math.round(data.current.apparent_temperature),
    };

    // Take the first 5 days for the forecast list.
    const forecast: ForecastDay[] = data.daily.time.slice(0, 5).map((date, index) => {
      const condition = this.mapCondition(data.daily.weather_code[index]);
      return {
        day: this.formatDay(date),
        condition,
        high: Math.round(data.daily.temperature_2m_max[index]),
        low: Math.round(data.daily.temperature_2m_min[index]),
      };
    });

    return { weather, forecast };
  }

  // Save the latest weather so we can show it later if offline.
  async saveCache(weather: Weather, forecast: ForecastDay[]): Promise<string> {
    const updatedAt = new Date().toISOString();
    const cache: WeatherCache = { weather, forecast, updatedAt };
    await this.storage.set(CACHE_KEY, cache);
    return updatedAt;
  }

  // Load the last saved weather, if there is one.
  async loadCache(): Promise<WeatherCache | null> {
    return this.storage.get<WeatherCache>(CACHE_KEY);
  }

  // All weather icons are normal image files inside src/assets/icons/weather.
  getIcon(condition: WeatherCondition): string {
    const fileNames: Record<WeatherCondition, string> = {
      sunny: 'sun',
      'partly-cloudy': 'partly-cloudy',
      cloudy: 'cloud',
      rainy: 'rain',
    };

    return `assets/icons/weather/${fileNames[condition]}.svg`;
  }

  // Turn an Open-Meteo weather code into one of our 4 conditions.
  private mapCondition(code: number): WeatherCondition {
    if (code === 0) {
      return 'sunny';
    }

    if (code >= 1 && code <= 3) {
      return code === 1 ? 'partly-cloudy' : 'cloudy';
    }

    if (code === 45 || code === 48) {
      return 'cloudy';
    }

    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) {
      return 'rainy';
    }

    if (code >= 71 && code <= 77) {
      return 'cloudy';
    }

    return 'cloudy';
  }

  private getConditionLabel(condition: WeatherCondition): string {
    const labels: Record<WeatherCondition, string> = {
      sunny: 'Sunny',
      'partly-cloudy': 'Partly Cloudy',
      cloudy: 'Cloudy',
      rainy: 'Rainy',
    };

    return labels[condition];
  }

  private formatDay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short' });
  }
}
