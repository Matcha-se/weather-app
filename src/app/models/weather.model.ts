// The four weather pictures we support.
export type WeatherCondition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy';

// Temperatures are in Celsius, wind is in km/h.
export interface Weather {
  placeName: string;
  temperature: number;
  condition: WeatherCondition;
  conditionLabel: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

// One row in the 5-day forecast list.
export interface ForecastDay {
  day: string;
  condition: WeatherCondition;
  high: number;
  low: number;
}
