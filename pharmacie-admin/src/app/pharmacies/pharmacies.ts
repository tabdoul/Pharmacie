import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { messageErreur, normaliser } from '../erreurs';
import { LIBELLE_STATUT, Pharmacie, STATUTS, Statut } from '../models';

@Component({
  selector: 'app-pharmacies',
  templateUrl: './pharmacies.html',
  styleUrl: './pharmacies.css',
})
export class Pharmacies implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly statuts = STATUTS;
  protected readonly libelleStatut = LIBELLE_STATUT;

  protected readonly pharmacies = signal<Pharmacie[]>([]);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly onglet = signal<Statut>('EN_ATTENTE');
  protected readonly recherche = signal('');
  private readonly selectionId = signal<number | null>(null);

  protected readonly modeRejet = signal(false);
  protected readonly motif = signal('');
  protected readonly actionEnCours = signal(false);
  protected readonly erreurAction = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);

  protected readonly compteurs = computed(() => {
    const c: Record<Statut, number> = { EN_ATTENTE: 0, VALIDEE: 0, REJETEE: 0 };
    for (const p of this.pharmacies()) {
      c[p.statutValidation]++;
    }
    return c;
  });

  protected readonly liste = computed(() => {
    const q = normaliser(this.recherche());
    return this.pharmacies().filter((p) => {
      if (p.statutValidation !== this.onglet()) {
        return false;
      }
      if (!q) {
        return true;
      }
      const texte = [p.nom, p.ville, p.quartier, p.identifiantConnexion, p.telephone].join(' ');
      return normaliser(texte).includes(q);
    });
  });

  protected readonly selection = computed(
    () => this.pharmacies().find((p) => p.id === this.selectionId()) ?? null,
  );

  protected readonly texteVide = computed(
    () => this.statuts.find((s) => s.valeur === this.onglet())?.vide ?? '',
  );

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.api.lister().subscribe({
      next: (donnees) => {
        this.pharmacies.set(donnees);
        this.chargement.set(false);
      },
      error: (e) => {
        this.erreur.set(messageErreur(e, 'Impossible de charger les pharmacies.'));
        this.chargement.set(false);
      },
    });
  }

  protected changerOnglet(statut: Statut): void {
    this.onglet.set(statut);
    this.fermerDetail();
  }

  protected choisir(p: Pharmacie): void {
    this.selectionId.set(p.id);
    this.modeRejet.set(false);
    this.motif.set('');
    this.erreurAction.set(null);
    this.info.set(null);
  }

  protected fermerDetail(): void {
    this.selectionId.set(null);
    this.modeRejet.set(false);
    this.motif.set('');
    this.erreurAction.set(null);
  }

  /** Ouvre le document d'agrement dans un nouvel onglet. */
  protected voirDocument(p: Pharmacie): void {
    this.erreurAction.set(null);
    // Onglet ouvert tout de suite (clic de l'utilisateur) pour ne pas etre bloque par le navigateur
    const fenetre = window.open('', '_blank');

    this.api.document(p.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        if (fenetre) {
          fenetre.location.href = url;
        } else {
          window.open(url, '_blank');
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        fenetre?.close();
        this.erreurAction.set(
          "Impossible d'ouvrir le document : fichier introuvable ou serveur indisponible.",
        );
      },
    });
  }

  protected valider(p: Pharmacie): void {
    if (!confirm(`Valider la pharmacie « ${p.nom} » ?\nElle pourra se connecter et gérer son stock.`)) {
      return;
    }
    this.executer(this.api.valider(p.id), `« ${p.nom} » a été validée.`);
  }

  protected ouvrirRejet(): void {
    this.modeRejet.set(true);
    this.erreurAction.set(null);
  }

  protected annulerRejet(): void {
    this.modeRejet.set(false);
    this.motif.set('');
  }

  protected confirmerRejet(p: Pharmacie): void {
    const motif = this.motif().trim();
    if (!motif) {
      this.erreurAction.set('Indiquez le motif du rejet : il sera communiqué à la pharmacie.');
      return;
    }
    this.executer(this.api.rejeter(p.id, motif), `« ${p.nom} » a été rejetée.`);
  }

  private executer(appel: ReturnType<ApiService['valider']>, messageSucces: string): void {
    this.actionEnCours.set(true);
    this.erreurAction.set(null);
    appel.subscribe({
      next: (maj) => {
        this.pharmacies.update((liste) => liste.map((x) => (x.id === maj.id ? maj : x)));
        this.actionEnCours.set(false);
        this.fermerDetail();
        this.info.set(messageSucces);
      },
      error: (e) => {
        this.erreurAction.set(messageErreur(e, "L'opération a échoué."));
        this.actionEnCours.set(false);
      },
    });
  }

  protected saisirRecherche(valeur: string): void {
    this.recherche.set(valeur);
  }

  protected saisirMotif(valeur: string): void {
    this.motif.set(valeur);
  }
}
