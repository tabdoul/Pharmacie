package com.pharmacie.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    private final SecretKey cle;
    private final long expirationMs;

    public JwtUtil(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.cle = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String genererToken(String identifiantConnexion, Long pharmacieId) {
        Date maintenant = new Date();
        Date expiration = new Date(maintenant.getTime() + expirationMs);

        return Jwts.builder()
            .subject(identifiantConnexion)
            .claim("pharmacieId", pharmacieId)
            .issuedAt(maintenant)
            .expiration(expiration)
            .signWith(cle, SignatureAlgorithm.HS256)
            .compact();
    }

    public String extraireIdentifiantConnexion(String token) {
        return extraireClaim(token, Claims::getSubject);
    }

    public Long extrairePharmacieId(String token) {
        Claims claims = extraireToutesLesClaims(token);
        return claims.get("pharmacieId", Long.class);
    }

    public boolean estValide(String token, String identifiantConnexion) {
        try {
            String sujet = extraireIdentifiantConnexion(token);
            return sujet.equals(identifiantConnexion) && !estExpire(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean estExpire(String token) {
        return extraireClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extraireClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extraireToutesLesClaims(token);
        return resolver.apply(claims);
    }

    private Claims extraireToutesLesClaims(String token) {
        try {
            return Jwts.parser()
                .verifyWith(cle)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }
}