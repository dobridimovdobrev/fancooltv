import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminPersonsComponent } from './admin-persons.component';
import { NgxBootstrapModule } from '../../../shared/ngx-bootstrap/ngx-bootstrap.module';

const routes: Routes = [
  {
    path: '',
    component: AdminPersonsComponent
  }
];

@NgModule({
  declarations: [
    AdminPersonsComponent
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
