import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ProfileEditModalComponent } from '../components/profile-edit-modal/profile-edit-modal.component';
import { User } from '../../models/auth.models';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isMobileMenuOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private bsModalService: BsModalService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    // Sottoscrizione agli aggiornamenti dello stato di autenticazione
    this.authService.currentUser.subscribe(() => {
      // Questo verrà eseguito ogni volta che lo stato dell'utente cambia
      console.log('Stato autenticazione aggiornato');
    });
  }

  /**
   * Opens the profile edit modal for regular users
   */
  openProfileModal(): void {
    const modalRef: BsModalRef = this.bsModalService.show(ProfileEditModalComponent, {
      class: 'modal-lg modal-dialog-centered'
    });

    if (modalRef.content) {
      modalRef.content.profileUpdated.subscribe((updatedUser: User) => {
        this.authService.updateCurrentUser(updatedUser);
      });
    }
  }
  
  /**
   * Opens the credits management modal for regular users
   */
  openCreditsModal(): void {
    this.modalService.openCreditsModal();
  }

  /**
   * Toggle mobile menu visibility
   */
  toggleMobileMenu(): void {
    console.log('toggleMobileMenu chiamato');
    console.log('Stato precedente:', this.isMobileMenuOpen);
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    console.log('Nuovo stato:', this.isMobileMenuOpen);
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    console.log('closeMobileMenu chiamato');
    this.isMobileMenuOpen = false;
    console.log('Menu mobile chiuso, stato:', this.isMobileMenuOpen);
  }

  /**
   * Gestisce il logout dell'utente
   */
  logout(): void {
    console.log('Logout in corso...');
    this.authService.logout();
    // Reindirizza alla home page dopo il logout
    this.router.navigate(['/']);
  }
}
