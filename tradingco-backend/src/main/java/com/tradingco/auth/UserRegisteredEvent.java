package com.tradingco.auth;

import java.util.UUID;

/** Published after a user successfully registers, so other modules can react (e.g. create a portfolio). */
public record UserRegisteredEvent(UUID userId) {
}
