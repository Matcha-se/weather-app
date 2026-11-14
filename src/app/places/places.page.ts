import { Component, inject } from '@angular/core';
import type { Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';

import type { Place } from '../models/place.model';
import { PlacesService } from '../services/places.service';

@Component({
  selector: 'app-places',
  templateUrl: 'places.page.html',
  styleUrls: ['places.page.scss'],
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent],
})
export class PlacesPage {
  private readonly placesService = inject(PlacesService);

  // The service signal updates this page automatically.
  readonly places: Signal<Place[]> = this.placesService.places;

  deletePlace(place: Place): void {
    const shouldDelete = window.confirm(`Delete ${place.name}?`);
    if (shouldDelete) {
      this.placesService.deletePlace(place.id);
    }
  }
}
