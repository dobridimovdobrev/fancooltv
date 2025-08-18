import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminPersonsComponent } from './admin-persons.component';
import { PersonFormPageComponent } from './person-form-page.component';
import { PersonFormComponent } from './person-form.component';
import { NgxBootstrapModule } from '../../../shared/ngx-bootstrap/ngx-bootstrap.module';

const routes: Routes = [
  {
    path: '',
    component: AdminPersonsComponent
  },
  {
    path: 'create',
    component: PersonFormPageComponent
  },
  {
    path: 'edit/:id',
    component: PersonFormPageComponent
  }
];

@NgModule({
  declarations: [
    AdminPersonsComponent,
    PersonFormPageComponent,
    PersonFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxBootstrapModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminPersonsModule { }
