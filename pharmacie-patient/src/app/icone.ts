import { Component, input } from '@angular/core';

export type NomIcone =
  | 'search'
  | 'location'
  | 'chat'
  | 'medical'
  | 'fleche'
  | 'medkit'
  | 'horloge'
  | 'business'
  | 'retour'
  | 'plus'
  | 'fermer'
  | 'chevron-bas'
  | 'chevron-haut'
  | 'coche'
  | 'coche-cercle'
  | 'croix-cercle'
  | 'telephone'
  | 'panier'
  | 'alerte'
  | 'hors-ligne'
  | 'rafraichir'
  | 'corbeille'
  | 'case'
  | 'case-cochee'
  | 'coche-double';

/** Petites icones (SVG) equivalentes a celles de l'app mobile. La couleur suit le texte. */
@Component({
  selector: 'app-icone',
  template: `
    <svg
      [attr.width]="taille()"
      [attr.height]="taille()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="epaisseur()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (nom()) {
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5 21 21" />
        }
        @case ('location') {
          <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        }
        @case ('chat') {
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="2.4" />
        }
        @case ('medical') {
          <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
        }
        @case ('fleche') {
          <path d="M5 12h14M13 6l6 6-6 6" />
        }
        @case ('medkit') {
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <path d="M9 7V5h6v2M12 11v6M9 14h6" />
        }
        @case ('horloge') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        }
        @case ('business') {
          <rect x="5" y="3" width="14" height="18" rx="1.5" />
          <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-4h4v4" />
        }
        @case ('retour') {
          <path d="M19 12H5M11 6l-6 6 6 6" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('fermer') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ('chevron-bas') {
          <path d="m6 9 6 6 6-6" />
        }
        @case ('chevron-haut') {
          <path d="m6 15 6-6 6 6" />
        }
        @case ('coche') {
          <path d="m5 13 4 4L19 7" />
        }
        @case ('coche-cercle') {
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.5 3 3 5-6" />
        }
        @case ('croix-cercle') {
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6M15 9l-6 6" />
        }
        @case ('telephone') {
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        }
        @case ('panier') {
          <path d="M6 8h12l1 12H5L6 8z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        }
        @case ('alerte') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        }
        @case ('hors-ligne') {
          <path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a4 4 0 0 1 .5 8.5H7z" />
          <path d="M4 4l16 16" />
        }
        @case ('rafraichir') {
          <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
        }
        @case ('corbeille') {
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        }
        @case ('case') {
          <rect x="4" y="4" width="16" height="16" rx="3" />
        }
        @case ('case-cochee') {
          <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" />
          <path d="m8 12.5 3 3 5-6" stroke="#ffffff" />
        }
        @case ('coche-double') {
          <path d="m2 12 4 4 9-9M12 15l2 2 8-9" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
  `,
})
export class Icone {
  readonly nom = input.required<NomIcone>();
  readonly taille = input(18);
  readonly epaisseur = input(2);
}
