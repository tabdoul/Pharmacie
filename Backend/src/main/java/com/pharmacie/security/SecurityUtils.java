package com.pharmacie.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Long pharmacieConnecteeId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof PharmacieUserDetails details)) {
            throw new IllegalStateException("Aucune pharmacie authentifiee dans le contexte de securite.");
        }
        return details.getPharmacie().getId();
    }
}