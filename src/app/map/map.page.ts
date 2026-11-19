import { Component, inject } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import { IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import * as L from 'leaflet';

import type { Place } from '../models/place.model';
import { LocationService } from '../services/location.service';
import { PlacesService } from '../services/places.service';
import { VibrationService } from '../services/vibration.service';

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon],
})
export class MapPage implements OnDestroy {
  private readonly placesService = inject(PlacesService);
  private readonly locationService = inject(LocationService);
  private readonly vibrationService = inject(VibrationService);

  private map?: L.Map;
  private myLocationMarker?: L.CircleMarker;
  private placeMarkers: L.CircleMarker[] = [];

  places: Place[] = [];
  myLatitude = 15.3071;
  myLongitude = 120.9467;

  // Ionic calls this every time the Map tab becomes visible.
  async ionViewDidEnter(): Promise<void> {
    await this.placesService.loadPlaces();
    this.places = this.placesService.getPlaces();

    const location = await this.locationService.getCurrentLocation();
    this.myLatitude = location.latitude;
    this.myLongitude = location.longitude;

    this.setupMap();

    // Fix gray map issues when returning to the tab.
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  // Clean up the map when leaving so markers do not duplicate on re-entry.
  ionViewWillLeave(): void {
    this.removeMap();
  }

  ngOnDestroy(): void {
    this.removeMap();
  }

  // Center the map on my current location.
  async locateMe(): Promise<void> {
    const location = await this.locationService.getCurrentLocation();
    this.myLatitude = location.latitude;
    this.myLongitude = location.longitude;

    this.showMyLocationMarker();

    if (this.map) {
      this.map.setView([this.myLatitude, this.myLongitude], 14);
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);
    }
  }

  private setupMap(): void {
    this.removeMap();

    const map = L.map('weather-map').setView([this.myLatitude, this.myLongitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    this.map = map;

    this.showMyLocationMarker();
    this.showPlaceMarkers();
  }

  // Blue marker for my current location.
  private showMyLocationMarker(): void {
    if (!this.map) {
      return;
    }

    if (this.myLocationMarker) {
      this.myLocationMarker.remove();
    }

    this.myLocationMarker = L.circleMarker([this.myLatitude, this.myLongitude], {
      radius: 8,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 1,
      weight: 2,
    })
      .addTo(this.map)
      .bindPopup('My location');
  }

  // Red pins for saved places with name and note.
  private showPlaceMarkers(): void {
    if (!this.map) {
      return;
    }

    // Remove old place markers before adding them again.
    this.placeMarkers.forEach((marker) => marker.remove());
    this.placeMarkers = [];

    this.places.forEach((place) => {
      const popupText = `<strong>${this.escapeHtml(place.name)}</strong><br>${this.escapeHtml(place.note || '')}`;

      const marker = L.circleMarker([place.latitude, place.longitude], {
        radius: 7,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 1,
        weight: 2,
      })
        .addTo(this.map as L.Map)
        .bindPopup(popupText);

      this.placeMarkers.push(marker);
    });
  }

  private removeMap(): void {
    this.placeMarkers.forEach((marker) => marker.remove());
    this.placeMarkers = [];

    if (this.myLocationMarker) {
      this.myLocationMarker.remove();
      this.myLocationMarker = undefined;
    }

    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  // Small helper to keep popup text safe.
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
