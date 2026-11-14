import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  cloudyOutline,
  createOutline,
  locationOutline,
  mapOutline,
  refreshOutline,
  saveOutline,
  trashOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // Register the Ionicons used in the app.
    // Keeping them in one place is easier for a small project.
    addIcons({
      addOutline,
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
