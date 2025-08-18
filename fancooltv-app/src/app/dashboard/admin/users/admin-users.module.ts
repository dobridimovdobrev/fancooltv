import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminUsersComponent } from './admin-users.component';
import { UserEditPageComponent } from './user-edit-page/user-edit-page.component';
import { UserCreatePageComponent } from './user-create-page/user-create-page.component';
import { NgxBootstrapModule } from '../../../shared/ngx-bootstrap/ngx-bootstrap.module';

const routes: Routes = [
  {
    path: '',
    component: AdminUsersComponent
  },
  {
    path: 'create',
    component: UserCreatePageComponent
  },
  {
    path: 'edit/:id',
    component: UserEditPageComponent
  }
];

@NgModule({
  declarations: [
    AdminUsersComponent,
    UserEditPageComponent,
    UserCreatePageComponent
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
