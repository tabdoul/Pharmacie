package com.pharmacie.repository;

import com.pharmacie.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Toutes les notifications d'une pharmacie, les plus recentes en premier.
     */
    List<Notification> findByPharmacieIdOrderByDateCreationDesc(Long pharmacieId);

    /**
     * Notifications non lues d'une pharmacie (badge / compteur au tableau de bord).
     */
    List<Notification> findByPharmacieIdAndLueFalse(Long pharmacieId);
}