import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxBootstrapModule } from '../../shared/ngx-bootstrap/ngx-bootstrap.module';

// Definizione delle rotte per il modulo user
const routes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/user-profile.module').then(m => m.UserProfileModule)
  },
  {
    path: 'credits',
    loadChildren: () => import('./credits/user-credits.module').then(m => m.UserCreditsModule)
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxBootstrapModule,
    RouterModule.forChild(routes)
  ]
})
export class UserModule { }
