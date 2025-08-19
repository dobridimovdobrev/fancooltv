import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxBootstrapModule } from '../../../shared/ngx-bootstrap/ngx-bootstrap.module';

// Import the complete TV Series component
import { AdminTVSeriesComponent } from './admin-tvseries.component';
import { TVSeriesFormPageComponent } from './tvseries-form-page.component';
import { TVSeriesFormComponent } from './tvseries-form.component';

const routes: Routes = [
  {
    path: '',
    component: AdminTVSeriesComponent
  },
  {
    path: 'create',
    component: TVSeriesFormPageComponent
  },
  {
    path: 'edit/:id',
    component: TVSeriesFormPageComponent
  }
];

@NgModule({
  declarations: [
    AdminTVSeriesComponent,
    TVSeriesFormPageComponent,
    TVSeriesFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    NgxBootstrapModule
  ]
})
export class AdminTVSeriesModule { }
