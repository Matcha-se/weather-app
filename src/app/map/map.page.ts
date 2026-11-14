import { Component, inject } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import * as L from 'leaflet';

import type { Place } from '../models/place.model';
import { PlacesService } from '../services/places.service';

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class MapPage implements OnDestroy {
  private readonly placesService = inject(PlacesService);
  private map?: L.Map;

  places: Place[] = [];

  // Ionic calls this every time the Map tab becomes visible.
  ionViewDidEnter(): void {
    this.places = this.placesService.getPlaces();
    this.showMap();
  }

  ngOnDestroy(): void {
    // Always clean up the map when the page is destroyed.
    this.map?.remove();
  }

  private showMap(): void {
    // Remove the old map first so changed places are picked up.
    this.map?.remove();

    const map = L.map('weather-map').setView([15.3078, 120.9464], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Draw a simple blue dot for every saved place.
    this.places.forEach((place) => {
      L.circleMarker([place.latitude, place.longitude], {
        radius: 7,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 1,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(place.name);
    });

    this.map = map;
  }
}
