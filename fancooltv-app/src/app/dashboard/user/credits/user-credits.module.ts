import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserCreditsComponent } from './user-credits.component';

const routes: Routes = [
  {
    path: '',
    component: UserCreditsComponent
  }
];

@NgModule({
  declarations: [
    UserCreditsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class UserCreditsModule { }
