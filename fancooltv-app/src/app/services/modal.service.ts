import { Injectable } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ProfileEditModalComponent } from '../shared/components/profile-edit-modal/profile-edit-modal.component';
import { UserCreditsModalComponent } from '../shared/user-credits-modal/user-credits-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  constructor(private modalService: BsModalService) { }

  /**
   * Apre il modale di modifica del profilo
   */
  openProfileEditModal(): BsModalRef {
    return this.modalService.show(ProfileEditModalComponent, {
      class: 'modal-lg',
      backdrop: 'static',
      keyboard: false
    });
  }

  /**
   * Apre il modale di gestione dei crediti
   */
  openCreditsModal(): BsModalRef {
    return this.modalService.show(UserCreditsModalComponent, {
      class: 'modal-lg',
      backdrop: 'static',
      keyboard: false
    });
  }
}
