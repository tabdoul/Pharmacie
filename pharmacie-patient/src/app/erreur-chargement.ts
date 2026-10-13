import { Component, input, output } from '@angular/core';

import { Icone } from './icone';

/** Etat d'erreur avec un bouton pour relancer le chargement. */
@Component({
  selector: 'app-erreur-chargement',
  imports: [Icone],
  template: `
    <div class="boite" role="alert">
      <span class="rond"><app-icone nom="hors-ligne" [taille]="28" /></span>
      <p>{{ message() }}</p>
      <button type="button" class="btn-cta bouton" (click)="relancer.emit()">
        <app-icone nom="rafraichir" [taille]="16" />Réessayer
      </button>
    </div>
  `,
  styles: `
    .boite {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 48px 32px;
      text-align: center;
    }
    .rond {
      width: 64px;
      height: 64px;
      border-radius: 999px;
      background: var(--danger-fond);
      color: var(--danger);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    p {
      font-size: 14px;
      line-height: 20px;
      color: var(--texte-doux);
    }
    .bouton {
      width: auto;
      padding: 13px 22px;
      font-size: 14px;
      margin-top: 4px;
    }
  `,
})
export class ErreurChargement {
  readonly message = input.required<string>();
  readonly relancer = output<void>();
}
