package com.pharmacie.security;

import com.pharmacie.entity.Pharmacie;
import com.pharmacie.repository.PharmacieRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class PharmacieUserDetailsService implements UserDetailsService {

    private final PharmacieRepository pharmacieRepository;

    public PharmacieUserDetailsService(PharmacieRepository pharmacieRepository) {
        this.pharmacieRepository = pharmacieRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifiantConnexion) throws UsernameNotFoundException {
        Pharmacie pharmacie = pharmacieRepository.findByIdentifiantConnexion(identifiantConnexion)
            .orElseThrow(() -> new UsernameNotFoundException(
                "Aucune pharmacie avec cet identifiant : " + identifiantConnexion
            ));
        return new PharmacieUserDetails(pharmacie);
    }
}