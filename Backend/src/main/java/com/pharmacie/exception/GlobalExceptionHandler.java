package com.pharmacie.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> gererResourceNotFound(ResourceNotFoundException e) {
        return construireReponse(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, Object>> gererConflict(ConflictException e) {
        return construireReponse(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> gererAccesRefuse(AccessDeniedException e) {
        return construireReponse(HttpStatus.FORBIDDEN, e.getMessage());
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> gererCompteDesactive(DisabledException e) {
        return construireReponse(
            HttpStatus.FORBIDDEN,
            "Votre compte n'a pas encore ete valide par un administrateur, ou a ete rejete."
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> gererIdentifiantsInvalides(BadCredentialsException e) {
        return construireReponse(HttpStatus.UNAUTHORIZED, "Identifiant ou mot de passe incorrect.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> gererArgumentInvalide(IllegalArgumentException e) {
        return construireReponse(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> gererValidation(MethodArgumentNotValidException e) {
        Map<String, String> erreursChamps = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(err ->
            erreursChamps.put(err.getField(), err.getDefaultMessage())
        );

        Map<String, Object> corps = new HashMap<>();
        corps.put("timestamp", LocalDateTime.now());
        corps.put("status", HttpStatus.BAD_REQUEST.value());
        corps.put("message", "Erreur de validation des donnees transmises.");
        corps.put("erreurs", erreursChamps);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corps);
    }

    private ResponseEntity<Map<String, Object>> construireReponse(HttpStatus statut, String message) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("timestamp", LocalDateTime.now());
        corps.put("status", statut.value());
        corps.put("message", message);
        return ResponseEntity.status(statut).body(corps);
    }
}