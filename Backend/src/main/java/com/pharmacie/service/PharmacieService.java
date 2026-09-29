package com.pharmacie.service;

import com.pharmacie.entity.Pharmacie;
import com.pharmacie.exception.ConflictException;
import com.pharmacie.exception.ResourceNotFoundException;
import com.pharmacie.repository.PharmacieRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PharmacieService {

    private final PharmacieRepository pharmacieRepository;
    private final PasswordEncoder passwordEncoder;

    public PharmacieService(PharmacieRepository pharmacieRepository, PasswordEncoder passwordEncoder) {
        this.pharmacieRepository = pharmacieRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Inscription d'une nouvelle pharmacie. Le compte est cree avec le statut
     * EN_ATTENTE : la connexion reste bloquee tant qu'un administrateur n'a pas
     * valide le document legal d'agrement transmis.
     */
    @Transactional
    public Pharmacie creer(Pharmacie pharmacie) {
        if (pharmacieRepository.existsByIdentifiantConnexion(pharmacie.getIdentifiantConnexion())) {
            throw new ConflictException(
                "Cet identifiant de connexion est deja utilise : " + pharmacie.getIdentifiantConnexion()
            );
        }
        pharmacie.setMotDePasse(passwordEncoder.encode(pharmacie.getMotDePasse()));
        pharmacie.setStatutValidation(Pharmacie.StatutValidation.EN_ATTENTE);
        return pharmacieRepository.save(pharmacie);
    }

    public Pharmacie findById(Long id) {
        return pharmacieRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Pharmacie introuvable, id=" + id));
    }

    public Pharmacie findByIdentifiantConnexion(String identifiantConnexion) {
        return pharmacieRepository.findByIdentifiantConnexion(identifiantConnexion)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Aucune pharmacie avec cet identifiant : " + identifiantConnexion
            ));
    }

    public List<Pharmacie> findAll() {
        return pharmacieRepository.findAll();
    }

    public List<Pharmacie> findEnAttenteDeValidation() {
        return pharmacieRepository.findByStatutValidation(Pharmacie.StatutValidation.EN_ATTENTE);
    }

    /**
     * Liste des quartiers distincts utilises par les pharmacies validees,
     * pour le selecteur "Mon quartier" cote patient (comparaison de
     * proximite simple, sans geolocalisation).
     */
    public List<String> findQuartiersDisponibles() {
        return pharmacieRepository.findQuartiersDistincts();
    }

    @Transactional
    public Pharmacie mettreAJourProfil(Long id, Pharmacie donnees) {
        Pharmacie existante = findById(id);
        existante.setNom(donnees.getNom());
        existante.setAdresse(donnees.getAdresse());
        existante.setVille(donnees.getVille());
        existante.setQuartier(donnees.getQuartier());
        existante.setTelephone(donnees.getTelephone());
        return pharmacieRepository.save(existante);
    }

    @Transactional
    public void changerMotDePasse(Long id, String nouveauMotDePasse) {
        Pharmacie existante = findById(id);
        existante.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        pharmacieRepository.save(existante);
    }

    /**
     * Validation du document d'agrement par un administrateur : autorise la
     * pharmacie a se connecter au back-office.
     */
    @Transactional
    public Pharmacie valider(Long id) {
        Pharmacie pharmacie = findById(id);
        pharmacie.setStatutValidation(Pharmacie.StatutValidation.VALIDEE);
        pharmacie.setMotifRejet(null);
        return pharmacieRepository.save(pharmacie);
    }

    /**
     * Rejet du dossier d'inscription (document non valide, pharmacie jugee
     * informelle, etc.).
     */
    @Transactional
    public Pharmacie rejeter(Long id, String motif) {
        Pharmacie pharmacie = findById(id);
        pharmacie.setStatutValidation(Pharmacie.StatutValidation.REJETEE);
        pharmacie.setMotifRejet(motif);
        return pharmacieRepository.save(pharmacie);
    }
}