import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { messageErreur } from '../erreurs';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly sessionExpiree = inject(ActivatedRoute).snapshot.queryParamMap.has('expire');

  protected identifiant = '';
  protected motDePasse = '';
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  ngOnInit(): void {
    // Aucun compte admin : on propose la premiere installation
    this.auth.installationNecessaire().subscribe({
      next: (necessaire) => {
        if (necessaire) {
          this.router.navigate(['/installation']);
        }
      },
      error: () => {
        // serveur injoignable : l'erreur apparaitra a la tentative de connexion
      },
    });
  }

  protected seConnecter(): void {
    if (!this.identifiant.trim() || !this.motDePasse) {
      this.erreur.set('Saisissez votre identifiant et votre mot de passe.');
      return;
    }
    this.enCours.set(true);
    this.erreur.set(null);

    this.auth.connexion(this.identifiant.trim(), this.motDePasse).subscribe({
      next: () => this.router.navigate(['/pharmacies']),
      error: (e) => {
        this.erreur.set(messageErreur(e, 'Connexion impossible.'));
        this.enCours.set(false);
      },
    });
  }
}