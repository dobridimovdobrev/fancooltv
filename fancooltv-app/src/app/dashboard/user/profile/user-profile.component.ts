import { Component, OnInit } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/auth.models';
import { ProfileEditModalComponent } from '../../../shared/components/profile-edit-modal/profile-edit-modal.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  currentUser: User | null = null;
  modalRef?: BsModalRef;

  constructor(
    private authService: AuthService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    // Load current user data
    this.currentUser = this.authService.currentUserValue;
    
    // Subscribe to user updates
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  // Open profile edit modal
  openEditModal(): void {
    this.modalRef = this.modalService.show(ProfileEditModalComponent, {
      class: 'modal-lg',
      backdrop: 'static',
      keyboard: false
    });

    // Subscribe to profile update events
    if (this.modalRef.content) {
      this.modalRef.content.profileUpdated.subscribe((updatedUser: User) => {
        console.log('Profile updated:', updatedUser);
        // Update local user data
        this.currentUser = updatedUser;
        // Update auth service user data
        this.authService.currentUser.subscribe();
      });
    }
  }
}
