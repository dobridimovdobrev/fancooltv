import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';

// Placeholder per il componente che verrà implementato in futuro
@Component({
  template: `<div class="p-4"><h2>Gestione Serie TV</h2><p>Questa sezione è in fase di sviluppo</p></div>`
})
export class AdminTvseriesComponent {}

const routes: Routes = [
  {
    path: '',
    component: AdminTvseriesComponent
  }
];

@NgModule({
  declarations: [
    AdminTvseriesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminTvseriesModule { }
