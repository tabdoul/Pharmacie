package com.pharmacie.util;

import java.text.Normalizer;
import java.util.Locale;

public final class TexteUtil {

    private TexteUtil() {
    }

    /**
     * Normalise un texte pour la recherche : sans accents, en minuscules, sans espaces
     * en debut/fin. Exemple : " Paracétamol " -> "paracetamol".
     */
    public static String normaliser(String texte) {
        if (texte == null) {
            return "";
        }
        String sansAccents = Normalizer.normalize(texte, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
        return sansAccents.toLowerCase(Locale.ROOT).trim();
    }

   
    public static String cleComparaison(String texte) {
        return normaliser(texte)
            .replaceAll("([0-9])[.,]([0-9])", "$1p$2") // 2,5 reste different de 25
            .replaceAll("[^a-z0-9%/]", "");
    }
}