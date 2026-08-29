package com.tradingco.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Binds tradingco.* configuration into strongly typed records.
 */
public class AppProperties {

    @ConfigurationProperties(prefix = "tradingco.security.jwt")
    public record Jwt(
            String secret,
            Duration accessTokenTtl,
            Duration refreshTokenTtl
    ) {}

    @ConfigurationProperties(prefix = "tradingco.cors")
    public record Cors(String allowedOrigins) {
        public String[] origins() {
            return allowedOrigins == null ? new String[0] : allowedOrigins.split(",");
        }
    }

    @ConfigurationProperties(prefix = "tradingco.market")
    public record Market(
            long tickIntervalMs,
            java.math.BigDecimal startingCash
    ) {}
}
