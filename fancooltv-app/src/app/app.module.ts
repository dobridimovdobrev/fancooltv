import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxBootstrapModule } from './shared/ngx-bootstrap/ngx-bootstrap.module';
import { SharedModule } from './shared/shared.module';
import { HomeComponent } from './home/home.component';

import { MovieDetailsComponent } from './movie-details/movie-details.component';
import { TvseriesDetailsComponent } from './tvseries-details/tvseries-details.component';

import { TermsComponent } from './terms/terms.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { MoviesListWrapperComponent } from './movies/movies-list-wrapper/movies-list-wrapper.component';
import { TvseriesListWrapperComponent } from './tvseries/tvseries-list-wrapper/tvseries-list-wrapper.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    MovieDetailsComponent,
    TvseriesDetailsComponent,
    TermsComponent,
    LoginComponent,
    RegisterComponent,
    MoviesListWrapperComponent,
    TvseriesListWrapperComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NgxBootstrapModule,
    SharedModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
