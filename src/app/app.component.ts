import { Component, HostListener, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chevronBackOutline,
  chevronDownOutline,
  cloudyOutline,
  createOutline,
  locationOutline,
  mapOutline,
  refreshOutline,
  saveOutline,
  trashOutline,
} from 'ionicons/icons';
import { VibrationService } from './services/vibration.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly vibrationService = inject(VibrationService);

  // One global handler gives every button/tab click a short vibration.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.vibrationService.onClick(event);
  }

  constructor() {
    // Register the Ionicons used in the app.
    // Keeping them in one place is easier for a small project.
    addIcons({
      addOutline,
      chevronBackOutline,
      chevronDownOutline,
      cloudyOutline,
      createOutline,
      locationOutline,
      mapOutline,
      refreshOutline,
      saveOutline,
      trashOutline,
    });
  }
}
