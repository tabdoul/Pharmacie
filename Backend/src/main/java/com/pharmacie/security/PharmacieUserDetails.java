package com.pharmacie.security;

import com.pharmacie.entity.Pharmacie;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class PharmacieUserDetails implements UserDetails {

    private final Pharmacie pharmacie;

    public PharmacieUserDetails(Pharmacie pharmacie) {
        this.pharmacie = pharmacie;
    }

    public Pharmacie getPharmacie() {
        return pharmacie;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_PHARMACIEN"));
    }

    @Override
    public String getPassword() {
        return pharmacie.getMotDePasse();
    }

    @Override
    public String getUsername() {
        return pharmacie.getIdentifiantConnexion();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
public boolean isEnabled() {
    return pharmacie.getStatutValidation() == Pharmacie.StatutValidation.VALIDEE;
}
}