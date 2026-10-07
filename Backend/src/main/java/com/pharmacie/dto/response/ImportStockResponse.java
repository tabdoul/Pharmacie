package com.pharmacie.dto.response;

import java.util.List;

public record ImportStockResponse(
    int ajoutes,
    int ignores,
    List<String> erreurs
) {
}