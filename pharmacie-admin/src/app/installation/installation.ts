import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { messageErreur } from '../erreurs';

@Component({
  selector: 'app-installation',
  imports: [FormsModule],
  templateUrl: './installation.html',
  styleUrl: './installation.css',
})
export class Installation implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected code = '';
  protected identifiant = '';
  protected motDePasse = '';
  protected confirmation = '';
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  ngOnInit(): void {
    // Une fois le compte cree, cette page n'a plus lieu d'etre
    this.auth.installationNecessaire().subscribe({
      next: (necessaire) => {
        if (!necessaire) {
          this.router.navigate(['/connexion']);
        }
      },
      error: (e) => this.erreur.set(messageErreur(e, 'Impossible de joindre le serveur.')),
    });
  }

  protected creer(): void {
    if (!this.code.trim() || !this.identifiant.trim() || !this.motDePasse) {
      this.erreur.set('Remplissez tous les champs.');
      return;
    }
    if (this.motDePasse.length < 10) {
      this.erreur.set('Le mot de passe doit contenir au moins 10 caractères.');
      return;
    }
    if (this.motDePasse !== this.confirmation) {
      this.erreur.set('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    this.enCours.set(true);
    this.erreur.set(null);

    this.auth.installer(this.code.trim(), this.identifiant.trim(), this.motDePasse).subscribe({
      next: () => this.router.navigate(['/pharmacies']),
      error: (e) => {
        this.erreur.set(messageErreur(e, "L'installation a échoué."));
        this.enCours.set(false);
      },
    });
  }
}
