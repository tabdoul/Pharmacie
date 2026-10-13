
SELECT regexp_replace(regexp_replace(lower(unaccent(nom)), '([0-9])[.,]([0-9])', '\1p\2', 'g'), '[^a-z0-9%/]', '', 'g') AS cle,
       count(*)                      AS nb_fiches,
       array_agg(id  ORDER BY id)    AS ids,
       array_agg(nom ORDER BY id)    AS noms
FROM produits
GROUP BY 1
HAVING count(*) > 1;

-- ETAPE 2 : fusionner UN groupe.
-- Remplacer les deux valeurs ci-dessous :
--   garde  = id de la fiche a CONSERVER (celle avec le plus joli nom)
--   doublon = id de la fiche a SUPPRIMER
-- Puis executer le bloc, et recommencer pour chaque groupe trouve a l'etape 1.
DO $$
DECLARE
    garde   BIGINT := 8;    -- <-- fiche conservee
    doublon BIGINT := 20;   -- <-- fiche supprimee
BEGIN
    -- 1. Pharmacie qui a les DEUX fiches : on additionne les quantites sur la
    --    ligne conservee (remplacer "sg.quantite + sd.quantite" par
    --    "GREATEST(sg.quantite, sd.quantite)" pour garder la plus grande a la place).
    UPDATE stocks sg
       SET quantite = sg.quantite + sd.quantite,
           date_derniere_maj = NOW()
      FROM stocks sd
     WHERE sg.produit_id = garde
       AND sd.produit_id = doublon
       AND sg.pharmacie_id = sd.pharmacie_id;

    -- 2. Supprimer les notifications liees aux lignes de stock qui vont disparaitre
    DELETE FROM notifications
     WHERE stock_id IN (
            SELECT sd.id
              FROM stocks sd
              JOIN stocks sg ON sg.pharmacie_id = sd.pharmacie_id
                            AND sg.produit_id = garde
             WHERE sd.produit_id = doublon);

    -- 3. Supprimer la ligne de stock en double de ces pharmacies
    DELETE FROM stocks sd
     USING stocks sg
     WHERE sd.produit_id = doublon
       AND sg.produit_id = garde
       AND sg.pharmacie_id = sd.pharmacie_id;

    -- 4. Les autres pharmacies passent simplement sur la fiche conservee
    UPDATE stocks SET produit_id = garde WHERE produit_id = doublon;

    -- 5. Garder la photo du doublon si la fiche conservee n'en a pas
    UPDATE produits g
       SET image_url = d.image_url
      FROM produits d
     WHERE g.id = garde AND d.id = doublon AND g.image_url IS NULL;

    -- 6. Supprimer la fiche en double
    DELETE FROM produits WHERE id = doublon;
END $$;

-- ETAPE 3 : verifier (doit ne plus renvoyer le groupe fusionne)
-- Relancer la requete de l'etape 1.