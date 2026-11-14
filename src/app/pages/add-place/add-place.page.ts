import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { PlacesService } from '../../services/places.service';

@Component({
  selector: 'app-add-place',
  templateUrl: './add-place.page.html',
  styleUrls: ['./add-place.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
  ],
})
export class AddPlacePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly placesService = inject(PlacesService);

  placeId: string | null = null;
  name = '';
  // ion-input with type="number" gives us a number at runtime.
  latitude: string | number = '';
  longitude: string | number = '';
  isEditing = false;
  errorMessage = '';

  constructor() {
    // If the URL has an id (add-place/:id), we are editing an existing place.
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    const place = this.placesService.getPlace(id);
    if (!place) {
      return;
    }

    this.placeId = place.id;
    this.name = place.name;
    this.latitude = place.latitude.toString();
    this.longitude = place.longitude.toString();
    this.isEditing = true;
  }

  savePlace(): void {
    this.errorMessage = '';

    const latitude = Number(this.latitude);
    const longitude = Number(this.longitude);

    if (!this.name.trim()) {
      this.errorMessage = 'Please enter a place name.';
      return;
    }

    if (
      String(this.latitude).trim() === '' ||
      String(this.longitude).trim() === '' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      this.errorMessage = 'Latitude and longitude must be numbers.';
      return;
    }

    if (this.isEditing && this.placeId) {
      this.placesService.updatePlace({
        id: this.placeId,
        name: this.name.trim(),
        latitude,
        longitude,
      });
    } else {
      this.placesService.addPlace({
        name: this.name.trim(),
        latitude,
        longitude,
      });
    }

    this.router.navigateByUrl('/tabs/places');
  }
}
