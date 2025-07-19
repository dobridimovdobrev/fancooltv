import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  // Dati utente di esempio
  user = {
    id: 1,
    username: 'utente_esempio',
    email: 'utente@esempio.com',
    nome: 'Mario',
    cognome: 'Rossi',
    avatar: 'assets/images/avatar-placeholder.jpg',
    iscrittoDal: '01/01/2023',
    ultimoAccesso: '19/07/2025',
    preferiti: 12,
    recensioni: 5
  };

  constructor() { }

  ngOnInit(): void {
    // In una implementazione reale, qui si caricherebbero i dati dal servizio
  }

  // Metodo per aggiornare il profilo
  updateProfile(): void {
    // Implementazione del salvataggio profilo
    console.log('Profilo aggiornato');
  }

  // Metodo per cambiare la password
  changePassword(): void {
    // Implementazione del cambio password
    console.log('Password cambiata');
  }
}
