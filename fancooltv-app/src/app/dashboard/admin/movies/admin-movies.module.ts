import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Placeholder per il componente che verrà implementato in futuro
@Component({
  template: `<div class="p-4"><h2>Gestione Film</h2><p>Questa sezione è in fase di sviluppo</p></div>`
})
export class AdminMoviesComponent {}

const routes: Routes = [
  {
    path: '',
    component: AdminMoviesComponent
  }
];

@NgModule({
  declarations: [
    AdminMoviesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminMoviesModule { }

// Aggiungiamo l'import di Component che mancava
import { Component } from '@angular/core';
