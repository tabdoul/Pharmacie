package com.pharmacie.repository;

import com.pharmacie.entity.Administrateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdministrateurRepository extends JpaRepository<Administrateur, Long> {

    Optional<Administrateur> findByIdentifiant(String identifiant);

    boolean existsByIdentifiant(String identifiant);
}