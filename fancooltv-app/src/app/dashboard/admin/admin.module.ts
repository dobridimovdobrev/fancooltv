import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxBootstrapModule } from '../../shared/ngx-bootstrap/ngx-bootstrap.module';

// Definizione delle rotte per il modulo admin
const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./home/admin-home.module').then(m => m.AdminHomeModule)
  },
  {
    path: 'categories',
    loadChildren: () => import('./categories/admin-categories.module').then(m => m.AdminCategoriesModule)
  },
  {
    path: 'movies',
    loadChildren: () => import('./movies/admin-movies.module').then(m => m.AdminMoviesModule)
  },
  {
    path: 'tvseries',
    loadChildren: () => import('./tvseries/admin-tvseries.module').then(m => m.AdminTvseriesModule)
  },
  {
    path: 'persons',
    loadChildren: () => import('./persons/admin-persons.module').then(m => m.AdminPersonsModule)
  },
  {
    path: 'users',
    loadChildren: () => import('./users/admin-users.module').then(m => m.AdminUsersModule)
  },
  {
    path: 'countries',
    loadChildren: () => import('./countries/admin-countries.module').then(m => m.AdminCountriesModule)
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxBootstrapModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule { }
