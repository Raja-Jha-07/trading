package com.tradingco.common.exception;

import org.springframework.http.HttpStatus;

/** Thrown when a business rule is violated (e.g. insufficient funds, invalid order). */
public class BusinessException extends ApiException {
    public BusinessException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }

    public BusinessException(HttpStatus status, String message) {
        super(status, message);
    }
}
