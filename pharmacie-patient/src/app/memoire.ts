const CLE_QUARTIER = 'quartier_patient';

/** Quartier memorise sur cet appareil (equivalent du stockage de l'app mobile). */
export function lireQuartier(): string | null {
  try {
    return localStorage.getItem(CLE_QUARTIER);
  } catch {
    return null;
  }
}

export function ecrireQuartier(quartier: string | null): void {
  try {
    if (quartier) {
      localStorage.setItem(CLE_QUARTIER, quartier);
    } else {
      localStorage.removeItem(CLE_QUARTIER);
    }
  } catch {
    // Stockage indisponible (navigation privee...) : on ignore.
  }
}
