import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { MediaCardComponent } from './media-card/media-card.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from './error-message/error-message.component';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { MediaListComponent } from './components/media-list/media-list.component';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
    MediaCardComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    SearchFilterComponent,
    MediaListComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AccordionModule.forRoot(),
    BsDropdownModule.forRoot()
  ],
  exports: [
    NavbarComponent,
    FooterComponent,
    MediaCardComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    SearchFilterComponent,
    MediaListComponent,
    AccordionModule,
    BsDropdownModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }
