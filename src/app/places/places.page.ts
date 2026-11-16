import { Component, inject } from '@angular/core';
import type { Signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import type { Place } from '../models/place.model';
import { PlacesService } from '../services/places.service';
import { VibrationService } from '../services/vibration.service';

@Component({
  selector: 'app-places',
  templateUrl: 'places.page.html',
  styleUrls: ['places.page.scss'],
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonItemOptions,
    IonItemOption,
  ],
})
export class PlacesPage {
  private readonly placesService = inject(PlacesService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly vibrationService = inject(VibrationService);

  // The service signal updates this page automatically.
  readonly places: Signal<Place[]> = this.placesService.places;

  // Refresh the list every time the page is shown.
  async ionViewWillEnter(): Promise<void> {
    await this.placesService.loadPlaces();
  }

  editPlace(place: Place): void {
    void this.router.navigate(['/add-place', place.id]);
  }

  // Ask for confirmation before deleting a place.
  async confirmDelete(place: Place, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) {
      await slidingItem.close();
    }

    const alert = await this.alertController.create({
      header: 'Delete place?',
      message: `Delete ${place.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.vibrationService.warning();
            await this.deletePlace(place);
          },
        },
      ],
    });

    await alert.present();
  }

  // Delete the place and show a success message.
  private async deletePlace(place: Place): Promise<void> {
    this.placesService.deletePlace(place.id);
    await this.vibrationService.success();
    await this.showToast('Place deleted.');
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
