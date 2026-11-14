import type { Routes } from '@angular/router';

export const routes: Routes = [
  // The tab pages live inside the tabs layout.
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'map',
        loadComponent: () => import('./map/map.page').then((m) => m.MapPage),
      },
      {
        path: 'places',
        loadComponent: () => import('./places/places.page').then((m) => m.PlacesPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },

  // Add/Edit Place is OUTSIDE the tabs layout, so the tab bar is hidden.
  {
    path: 'add-place',
    loadComponent: () => import('./pages/add-place/add-place.page').then((m) => m.AddPlacePage),
  },
  {
    path: 'add-place/:id',
    loadComponent: () => import('./pages/add-place/add-place.page').then((m) => m.AddPlacePage),
  },

  // Opening the app goes straight to Home.
  {
    path: '',
    redirectTo: 'tabs/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'tabs/home',
  },
];
