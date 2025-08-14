import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminUsersComponent } from './admin-users.component';
import { NgxBootstrapModule } from '../../../shared/ngx-bootstrap/ngx-bootstrap.module';

const routes: Routes = [
  {
    path: '',
    component: AdminUsersComponent
  }
];

@NgModule({
  declarations: [
    AdminUsersComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxBootstrapModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminUsersModule { }
