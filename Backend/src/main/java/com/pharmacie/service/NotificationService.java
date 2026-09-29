package com.pharmacie.service;

import com.pharmacie.entity.Notification;
import com.pharmacie.entity.Pharmacie;
import com.pharmacie.entity.Stock;
import com.pharmacie.exception.ResourceNotFoundException;
import com.pharmacie.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification creerAlerteStockFaible(Pharmacie pharmacie, Stock stock) {
        Notification notification = new Notification();
        notification.setPharmacie(pharmacie);
        notification.setStock(stock);
        notification.setMessage(
            "Stock faible pour \"" + stock.getProduit().getNom() + "\" : "
            + stock.getQuantite() + " unite(s) restante(s) (seuil : " + stock.getSeuilAlerte() + ")."
        );
        return notificationRepository.save(notification);
    }

    public List<Notification> findByPharmacie(Long pharmacieId) {
        return notificationRepository.findByPharmacieIdOrderByDateCreationDesc(pharmacieId);
    }

    public List<Notification> findNonLuesByPharmacie(Long pharmacieId) {
        return notificationRepository.findByPharmacieIdAndLueFalse(pharmacieId);
    }

    @Transactional
    public Notification marquerCommeLue(Long id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable, id=" + id));
        notification.setLue(true);
        return notificationRepository.save(notification);
    }
}