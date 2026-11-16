import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

// This service handles the phone's GPS in one place so every page can reuse it.
@Injectable({
  providedIn: 'root',
})
export class LocationService {
  // Gapan, Nueva Ecija is used when location is not available.
  readonly DEFAULT_LOCATION = {
    latitude: 15.3071,
    longitude: 120.9467,
  };

  // Ask for permission if needed, then try to get the current GPS position.
  // If anything fails, we return the default location instead.
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number; usedFallback: boolean }> {
    try {
      // Use a timeout so the app does not get stuck loading forever.
      return await this.withTimeout(this.getLocation(), 12000);
    } catch {
      // If GPS fails for any reason, use the default location.
      return { ...this.DEFAULT_LOCATION, usedFallback: true };
    }
  }

  private async getLocation(): Promise<{ latitude: number; longitude: number; usedFallback: boolean }> {
    // Check if we already have permission to use location.
    let permission = await Geolocation.checkPermissions();

    // If the app has not asked yet, ask the user now.
    if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
      permission = await Geolocation.requestPermissions();
    }

    // If permission was denied, fall back to Gapan.
    if (permission.location !== 'granted') {
      return { ...this.DEFAULT_LOCATION, usedFallback: true };
    }

    // Get the device's current position.
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      usedFallback: false,
    };
  }

  // Helper to stop waiting if something takes too long.
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Location timeout'));
      }, ms);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}
