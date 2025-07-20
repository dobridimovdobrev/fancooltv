import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import components
import { AdminMoviesComponent } from './admin-movies.component';
import { MovieFormComponent } from './movie-form.component';
import { MovieFormPageComponent } from './movie-form-page.component';

// Import NgxBootstrap module
import { NgxBootstrapModule } from '../../../shared/ngx-bootstrap/ngx-bootstrap.module';

const routes: Routes = [
  {
    path: '',
    component: AdminMoviesComponent
  },
  {
    path: 'create',
    component: MovieFormPageComponent
  },
  {
    path: 'edit/:id',
    component: MovieFormPageComponent
  }
];

@NgModule({
  declarations: [
    AdminMoviesComponent,
    MovieFormComponent,
    MovieFormPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxBootstrapModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminMoviesModule { }

// Nota: MovieFormPageComponent è già importato sopra
