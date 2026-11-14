import { Injectable } from '@angular/core';

import type { ForecastDay, Weather, WeatherCondition } from '../models/weather.model';

// Fake weather data for now.
// Later you can replace these methods with real API calls.
@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  getCurrentWeather(placeName = 'Gapan, Nueva Ecija'): Weather {
    return {
      placeName,
      temperature: 31,
      condition: 'partly-cloudy',
      conditionLabel: 'Partly Cloudy',
      humidity: 68,
      windSpeed: 12,
      feelsLike: 34,
    };
  }

  getForecast(): ForecastDay[] {
    return [
      { day: 'Mon', condition: 'partly-cloudy', high: 32, low: 24 },
      { day: 'Tue', condition: 'sunny', high: 33, low: 25 },
      { day: 'Wed', condition: 'rainy', high: 29, low: 23 },
      { day: 'Thu', condition: 'cloudy', high: 30, low: 23 },
      { day: 'Fri', condition: 'sunny', high: 33, low: 25 },
    ];
  }

  // All weather icons are normal image files inside src/assets/icons/weather.
  // Replace a picture there and the app will show your own icon.
  getIcon(condition: WeatherCondition): string {
    // The condition names and file names are a little different,
    // so this small map connects them.
    const fileNames: Record<WeatherCondition, string> = {
      sunny: 'sun',
      'partly-cloudy': 'partly-cloudy',
      cloudy: 'cloud',
      rainy: 'rain',
    };

    return `assets/icons/weather/${fileNames[condition]}.svg`;
  }
}
