import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import the complete TV Series component
import { AdminTVSeriesComponent } from './admin-tvseries.component';

const routes: Routes = [
  {
    path: '',
    component: AdminTVSeriesComponent
  }
];

@NgModule({
  declarations: [
    AdminTVSeriesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AdminTVSeriesModule { }
