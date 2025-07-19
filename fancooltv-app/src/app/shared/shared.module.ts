import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    AccordionModule.forRoot(),
    BsDropdownModule.forRoot()
  ],
  exports: [
    NavbarComponent,
    FooterComponent,
    AccordionModule,
    BsDropdownModule
  ]
})
export class SharedModule { }
