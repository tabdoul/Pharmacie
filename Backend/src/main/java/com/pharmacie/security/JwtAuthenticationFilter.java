package com.pharmacie.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final PharmacieUserDetailsService pharmacieUserDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, PharmacieUserDetailsService pharmacieUserDetailsService) {
        this.jwtUtil = jwtUtil;
        this.pharmacieUserDetailsService = pharmacieUserDetailsService;
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

        try {
            identifiantConnexion = jwtUtil.extraireIdentifiantConnexion(token);
        } catch (Exception e) {
            // Token invalide ou expire : on laisse la requete continuer sans authentification,
            // Spring Security la rejettera si l'endpoint requiert d'etre authentifie.
        }

        if (identifiantConnexion != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = pharmacieUserDetailsService.loadUserByUsername(identifiantConnexion);

            if (jwtUtil.estValide(token, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}