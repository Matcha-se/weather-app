import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  ToastController,
} from '@ionic/angular';

import { LocationService } from '../../services/location.service';
import { PlacesService } from '../../services/places.service';
import { VibrationService } from '../../services/vibration.service';

@Component({
  selector: 'app-add-place',
  templateUrl: './add-place.page.html',
  styleUrls: ['./add-place.page.scss'],
  imports: [
    ReactiveFormsModule,
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
  private readonly formBuilder = inject(FormBuilder);
  private readonly placesService = inject(PlacesService);
  private readonly locationService = inject(LocationService);
  private readonly vibrationService = inject(VibrationService);
  private readonly toastController = inject(ToastController);

  placeId: string | null = null;
  isEditing = false;
  isSaving = false;

  // Reactive form for the place details.
  // Latitude and longitude are filled by the GPS button and kept read-only in the UI.
  placeForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    note: [''],
    latitude: [''],
    longitude: [''],
  });

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
    this.isEditing = true;
    this.placeForm.patchValue({
      name: place.name,
      note: place.note || '',
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
    });
  }

  // Fill latitude and longitude using the device's real GPS location.
  async useCurrentLocation(): Promise<void> {
    await this.vibrationService.lightTap();

    try {
      const location = await this.locationService.getCurrentLocation();
      this.placeForm.patchValue({
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      });

      if (location.usedFallback) {
        await this.showToast('Could not get GPS. Used Gapan coordinates instead.');
      } else {
        await this.showToast('Current location added.');
      }
    } catch {
      await this.vibrationService.error();
      await this.showToast('Could not get your current location.');
    }
  }

  async savePlace(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    const name = this.placeForm.controls.name.value.trim();
    const note = this.placeForm.controls.note.value.trim();
    const latitudeText = this.placeForm.controls.latitude.value.trim();
    const longitudeText = this.placeForm.controls.longitude.value.trim();
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);

    // Simple checks before saving.
    if (!name) {
      await this.vibrationService.error();
      await this.showToast('Please enter a place name.');
      return;
    }

    if (!latitudeText || !longitudeText || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      await this.vibrationService.error();
      await this.showToast('Please use your current location to fill coordinates.');
      return;
    }

    this.isSaving = true;

    try {
      if (this.isEditing && this.placeId) {
        this.placesService.updatePlace({
          id: this.placeId,
          name,
          note,
          latitude,
          longitude,
        });
      } else {
        this.placesService.addPlace({
          name,
          note,
          latitude,
          longitude,
        });
      }

      await this.vibrationService.success();
      await this.showToast(this.isEditing ? 'Place updated.' : 'Place saved.');
      await this.router.navigateByUrl('/tabs/places');
    } catch {
      await this.vibrationService.error();
      await this.showToast('Could not save the place. Please try again.');
    } finally {
      this.isSaving = false;
    }
  }

  // Show a short message at the bottom of the screen.
  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
