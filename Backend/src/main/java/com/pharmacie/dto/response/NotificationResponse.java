package com.pharmacie.dto.response;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private Long stockId;
    private String message;
    private boolean lue;
    private LocalDateTime dateCreation;

    public NotificationResponse() {
    }

    public NotificationResponse(Long id, Long stockId, String message, boolean lue,
                                 LocalDateTime dateCreation) {
        this.id = id;
        this.stockId = stockId;
        this.message = message;
        this.lue = lue;
        this.dateCreation = dateCreation;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStockId() {
        return stockId;
    }

    public void setStockId(Long stockId) {
        this.stockId = stockId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isLue() {
        return lue;
    }

    public void setLue(boolean lue) {
        this.lue = lue;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}