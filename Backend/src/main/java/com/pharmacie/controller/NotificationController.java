package com.pharmacie.controller;

import com.pharmacie.dto.response.NotificationResponse;
import com.pharmacie.entity.Notification;
import com.pharmacie.security.SecurityUtils;
import com.pharmacie.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacien/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> lister() {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();
        return ResponseEntity.ok(
            notificationService.findByPharmacie(pharmacieId).stream().map(this::versDTO).toList()
        );
    }

    @GetMapping("/non-lues")
    public ResponseEntity<List<NotificationResponse>> listerNonLues() {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();
        return ResponseEntity.ok(
            notificationService.findNonLuesByPharmacie(pharmacieId).stream().map(this::versDTO).toList()
        );
    }

    @PatchMapping("/{id}/lue")
    public ResponseEntity<NotificationResponse> marquerCommeLue(@PathVariable Long id) {
        return ResponseEntity.ok(versDTO(notificationService.marquerCommeLue(id)));
    }

    private NotificationResponse versDTO(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getStock() != null ? notification.getStock().getId() : null,
            notification.getMessage(),
            notification.isLue(),
            notification.getDateCreation()
        );
    }
}