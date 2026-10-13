package com.pharmacie.security;

import com.pharmacie.repository.AdministrateurRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final PharmacieUserDetailsService pharmacieUserDetailsService;
    private final AdministrateurRepository administrateurRepository;

    public JwtAuthenticationFilter(
        JwtUtil jwtUtil,
        PharmacieUserDetailsService pharmacieUserDetailsService,
        AdministrateurRepository administrateurRepository
    ) {
        this.jwtUtil = jwtUtil;
        this.pharmacieUserDetailsService = pharmacieUserDetailsService;
        this.administrateurRepository = administrateurRepository;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String enTeteAuth = request.getHeader("Authorization");

        if (enTeteAuth == null || !enTeteAuth.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = enTeteAuth.substring(7);
        String identifiantConnexion = null;
        String role = null;

        try {
            identifiantConnexion = jwtUtil.extraireIdentifiantConnexion(token);
            role = jwtUtil.extraireRole(token);
        } catch (Exception e) {
            // Token invalide ou expire : on laisse la requete continuer sans authentification,
            // Spring Security la rejettera si l'endpoint requiert d'etre authentifie.
        }

        if (identifiantConnexion != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (JwtUtil.ROLE_ADMIN.equals(role)) {
                authentifierAdmin(request, token, identifiantConnexion);
            } else {
                authentifierPharmacie(request, token, identifiantConnexion);
            }
        }

        filterChain.doFilter(request, response);
    }

    /** Token admin : valide seulement si le compte existe toujours en base. */
    private void authentifierAdmin(HttpServletRequest request, String token, String identifiant) {
        if (jwtUtil.estValide(token, identifiant) && administrateurRepository.existsByIdentifiant(identifiant)) {
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                identifiant, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
    }

    private void authentifierPharmacie(HttpServletRequest request, String token, String identifiantConnexion) {
        try {
            UserDetails userDetails = pharmacieUserDetailsService.loadUserByUsername(identifiantConnexion);

            if (jwtUtil.estValide(token, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            // Compte pharmacie introuvable : requete non authentifiee.
        }
    }
}