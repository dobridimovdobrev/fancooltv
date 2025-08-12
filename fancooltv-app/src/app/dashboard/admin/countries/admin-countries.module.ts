import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap/modal';

import { AdminCountriesComponent } from './admin-countries.component';
import { CountryFormComponent } from './country-form.component';

@NgModule({
  declarations: [
    AdminCountriesComponent,
    CountryFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalModule.forRoot(),
    RouterModule.forChild([
      {
        path: '',
        component: AdminCountriesComponent
      },
      {
        path: 'create',
        component: CountryFormComponent
      },
      {
        path: 'edit/:id',
        component: CountryFormComponent
      }
    ])
  ]
})
export class AdminCountriesModule { }
