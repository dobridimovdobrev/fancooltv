import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxBootstrapModule } from '../../../shared/ngx-bootstrap/ngx-bootstrap.module';

import { AdminCategoriesComponent } from './admin-categories.component';
import { CategoryFormComponent } from './category-form.component';

@NgModule({
  declarations: [
    AdminCategoriesComponent,
    CategoryFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxBootstrapModule,
    RouterModule.forChild([
      {
        path: '',
        component: AdminCategoriesComponent
      },
      {
        path: 'create',
        component: CategoryFormComponent
      },
      {
        path: 'edit/:id',
        component: CategoryFormComponent
      }
    ])
  ]
})
export class AdminCategoriesModule { }
