import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { MoviesComponent } from './movies/movies.component';
import { MovieDetailsComponent } from './movie-details/movie-details.component';
import { TvseriesComponent } from './tvseries/tvseries.component';
import { TvseriesDetailsComponent } from './tvseries-details/tvseries-details.component';
import { TermsComponent } from './terms/terms.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'movies', component: MoviesComponent },
    { path: 'movie-details/:id', component: MovieDetailsComponent },
    { path: 'tvseries', component: TvseriesComponent },
    { path: 'tvseries-details/:id', component: TvseriesDetailsComponent },
    { path: 'terms', component: TermsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
