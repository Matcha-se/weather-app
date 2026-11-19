import { Component, inject } from '@angular/core';
import type { OnDestroy } from '@angular/core';
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
import * as L from 'leaflet';

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
export class AddPlacePage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly placesService = inject(PlacesService);
  private readonly locationService = inject(LocationService);
  private readonly vibrationService = inject(VibrationService);
  private readonly toastController = inject(ToastController);

  // Resolves once the place being edited (if any) has been loaded from the API.
  private readonly ready: Promise<void>;

  placeId: string | null = null;
  isEditing = false;
  isSaving = false;

  private map?: L.Map;
  private selectedMarker?: L.CircleMarker;

  // Reactive form for the place details.
  // Latitude and longitude are set by picking on the map or using current location.
  placeForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    note: [''],
    latitude: [''],
    longitude: [''],
  });

  constructor() {
    this.ready = this.loadPlaceForEdit();
  }

  // If the URL has an id (add-place/:id), load that place before showing the form.
  private async loadPlaceForEdit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    let place = this.placesService.getPlace(id);
    if (!place) {
      // A direct page load may happen before the first API request finishes.
      await this.placesService.loadPlaces();
      place = this.placesService.getPlace(id);
    }
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

  // Set up the picker map when the page is shown.
  async ionViewDidEnter(): Promise<void> {
    await this.ready;

    const lat = Number(this.placeForm.controls.latitude.value);
    const lng = Number(this.placeForm.controls.longitude.value);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && this.placeForm.controls.latitude.value !== '';

    if (hasCoords) {
      this.setupMap(lat, lng, 14);
      this.setSelectedMarker(lat, lng);
      return;
    }

    // For new places, start around the current/default location.
    const location = await this.locationService.getCurrentLocation();
    this.setupMap(location.latitude, location.longitude, 13);
  }

  ionViewWillLeave(): void {
    this.removeMap();
  }

  ngOnDestroy(): void {
    this.removeMap();
  }

  // Fill latitude and longitude using the device's real GPS location.
  async useCurrentLocation(): Promise<void> {
    try {
      const location = await this.locationService.getCurrentLocation();
      this.updateSelectedLocation(location.latitude, location.longitude, 15);

      if (location.usedFallback) {
        await this.showToast('Could not get GPS. Used Gapan location instead.');
      } else {
        await this.showToast('Current location selected.');
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
      await this.showToast('Please pick a location on the map.');
      return;
    }

    this.isSaving = true;

    try {
      if (this.isEditing && this.placeId) {
        await this.placesService.updatePlace({
          id: this.placeId,
          name,
          note,
          latitude,
          longitude,
        });
      } else {
        await this.placesService.addPlace({
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

  // Show selected coordinates in a simple format for the user.
  get selectedLocationLabel(): string {
    const latitudeText = this.placeForm.controls.latitude.value.trim();
    const longitudeText = this.placeForm.controls.longitude.value.trim();

    if (!latitudeText || !longitudeText) {
      return 'No location selected yet. Tap the map or use your current location.';
    }

    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return 'No location selected yet. Tap the map or use your current location.';
    }

    return `Selected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }

  private setupMap(latitude: number, longitude: number, zoom: number): void {
    this.removeMap();

    const map = L.map('pick-location-map').setView([latitude, longitude], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Tap/click on the map to choose a location.
    map.on('click', (event: L.LeafletMouseEvent) => {
      this.updateSelectedLocation(event.latlng.lat, event.latlng.lng);
    });

    this.map = map;

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  private updateSelectedLocation(latitude: number, longitude: number, zoom?: number): void {
    this.placeForm.patchValue({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });

    this.setSelectedMarker(latitude, longitude);

    if (this.map) {
      if (zoom) {
        this.map.setView([latitude, longitude], zoom);
      }
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);
    }
  }

  private setSelectedMarker(latitude: number, longitude: number): void {
    if (!this.map) {
      return;
    }

    if (this.selectedMarker) {
      this.selectedMarker.remove();
    }

    this.selectedMarker = L.circleMarker([latitude, longitude], {
      radius: 8,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 1,
      weight: 2,
    }).addTo(this.map);
  }

  private removeMap(): void {
    if (this.selectedMarker) {
      this.selectedMarker.remove();
      this.selectedMarker = undefined;
    }

    if (this.map) {
      this.map.remove();
      this.map = undefined;
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
