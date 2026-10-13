
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ----------------------------------------------------------------------------


INSERT INTO pharmacies
    (id, identifiant_connexion, mot_de_passe, nom, adresse, ville, quartier, telephone,
     document_agrement_path, statut_validation, motif_rejet)
VALUES
    (1, 'pharmacie.demo', '$2b$10$YgmLZmMHXeo34Bk5HkZ3Y.gDt.VOYrm9a6Ekhkytc/ivESX8dP6j2',
     'Pharmacie Centrale Kaloum', 'Avenue de la Republique', 'Conakry', 'Kaloum',
     '+224620000001', 'demo-agrement-1.pdf', 'VALIDEE', NULL),

    (2, 'pharmacie.enattente', '$2b$10$YgmLZmMHXeo34Bk5HkZ3Y.gDt.VOYrm9a6Ekhkytc/ivESX8dP6j2',
     'Pharmacie Nouvelle Matam', 'Route Le Prince', 'Conakry', 'Matam',
     '+224620000002', 'demo-agrement-2.pdf', 'EN_ATTENTE', NULL),

    (3, 'pharmacie.rejetee', '$2b$10$YgmLZmMHXeo34Bk5HkZ3Y.gDt.VOYrm9a6Ekhkytc/ivESX8dP6j2',
     'Pharmacie Test Ratoma', 'Carrefour Ratoma', 'Conakry', 'Ratoma',
     '+224620000003', 'demo-agrement-3.pdf', 'REJETEE', 'Document illisible, a retransmettre.')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- PRODUITS
-- ----------------------------------------------------------------------------

INSERT INTO produits (id, nom, forme, image_url, description) VALUES
    (1, 'Paracetamol 500mg', 'COMPRIME', NULL, 'Antalgique et antipyretique courant.'),
    (2, 'Amoxicilline 500mg', 'GELULE', NULL, 'Antibiotique a large spectre, sur conseil du pharmacien.'),
    (3, 'Sirop contre la toux', 'SIROP', NULL, 'Sirop antitussif pour adultes et enfants.'),
    (4, 'Serum physiologique', 'GOUTTES', NULL, 'Nettoyage nasal et oculaire.'),
    (5, 'Pommade antiseptique', 'POMMADE', NULL, 'Usage externe, plaies superficielles.'),
    (6, 'Vitamine C effervescente', 'COMPRIME', NULL, 'Complement en cas de fatigue passagere.'),
    (7, 'Spray nasal decongestionnant', 'SPRAY', NULL, 'Soulage la congestion nasale.')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- STOCKS (rattaches a la pharmacie 1, validee)
-- ----------------------------------------------------------------------------
-- Paracetamol   : disponible, largement au-dessus du seuil
-- Amoxicilline  : DISPONIBLE mais quantite <= seuil -> stock faible (notification generee ci-dessous)
-- Sirop         : quantite = 0 -> en RUPTURE, ne doit PAS apparaitre dans la recherche patient
-- Serum         : disponible normalement
-- ----------------------------------------------------------------------------

INSERT INTO stocks (id, pharmacie_id, produit_id, quantite, seuil_alerte, prix, date_derniere_maj) VALUES
    (1, 1, 1, 50, 10, 5000.00, NOW()),
    (2, 1, 2, 5, 10, 15000.00, NOW()),
    (3, 1, 3, 0, 5, 20000.00, NOW()),
    (4, 1, 4, 30, 5, 3000.00, NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
-- Correspond a l'alerte stock faible qui serait normalement generee automatiquement
-- par StockService lors d'une sauvegarde ou la quantite passe sous le seuil.
-- ----------------------------------------------------------------------------

INSERT INTO notifications (id, pharmacie_id, stock_id, message, lue, date_creation) VALUES
    (1, 1, 2, 'Stock faible pour "Amoxicilline 500mg" : 5 unite(s) restante(s) (seuil : 10).', false, NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Realignement des sequences d'identifiants (necessaire car les id sont
-- inseres explicitement ci-dessus ; sinon la prochaine insertion via l'API
-- pourrait entrer en collision avec un id deja utilise).
-- ----------------------------------------------------------------------------

SELECT setval(pg_get_serial_sequence('pharmacies', 'id'), (SELECT MAX(id) FROM pharmacies));
SELECT setval(pg_get_serial_sequence('produits', 'id'), (SELECT MAX(id) FROM produits));
SELECT setval(pg_get_serial_sequence('stocks', 'id'), (SELECT MAX(id) FROM stocks));
SELECT setval(pg_get_serial_sequence('notifications', 'id'), (SELECT MAX(id) FROM notifications));