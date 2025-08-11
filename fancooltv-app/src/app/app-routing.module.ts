import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { MoviesComponent } from './movies/movies.component';
import { MovieDetailsComponent } from './movie-details/movie-details.component';
import { TvseriesComponent } from './tvseries/tvseries.component';
import { TvseriesDetailsComponent } from './tvseries-details/tvseries-details.component';
import { TermsComponent } from './terms/terms.component';
import { MoviesListWrapperComponent } from './movies/movies-list-wrapper/movies-list-wrapper.component';
import { TvseriesListWrapperComponent } from './tvseries/tvseries-list-wrapper/tvseries-list-wrapper.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'movies', component: MoviesComponent, canActivate: [AuthGuard] },
    { path: 'movie-details/:id', component: MovieDetailsComponent, canActivate: [AuthGuard] },
    { path: 'tvseries', component: TvseriesComponent, canActivate: [AuthGuard] },
    { path: 'tvseries-details/:id', component: TvseriesDetailsComponent, canActivate: [AuthGuard] },
    { path: 'terms', component: TermsComponent },
    // Test routes for new MediaListComponent wrappers
    { path: 'movies-test', component: MoviesListWrapperComponent, canActivate: [AuthGuard] },
    { path: 'tvseries-test', component: TvseriesListWrapperComponent, canActivate: [AuthGuard] },
    // Dashboard route with lazy loading
    { 
      path: 'dashboard', 
      loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
      canActivate: [AuthGuard]
    },
    // Rotta di fallback per reindirizzare alla home
    { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
