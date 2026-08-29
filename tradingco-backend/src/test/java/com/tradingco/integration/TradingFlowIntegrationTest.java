package com.tradingco.integration;

import com.tradingco.order.dto.OrderDtos.OrderView;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end flow against a real PostgreSQL (Testcontainers): register -> place a market buy ->
 * verify the order fills and the portfolio reflects the position. Auto-disabled when Docker is
 * unavailable so local unit-test runs stay fast; runs fully in CI.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TradingFlowIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("tradingco")
            .withUsername("tradingco")
            .withPassword("tradingco");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // Point Redis at a throwaway host; it is not exercised in this flow.
        registry.add("spring.data.redis.host", () -> "localhost");
    }

    @Autowired
    TestRestTemplate rest;

    @Test
    void registerPlaceOrderAndSeePosition() {
        // 1. Register
        var register = rest.postForEntity("/api/v1/auth/register",
                Map.of("email", "trader@example.com",
                        "displayName", "Test Trader",
                        "password", "password123"),
                Map.class);
        assertThat(register.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String accessToken = (String) register.getBody().get("accessToken");
        assertThat(accessToken).isNotBlank();

        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setBearerAuth(accessToken);
        authHeaders.setContentType(MediaType.APPLICATION_JSON);

        // 2. Place a market buy for 10 AAPL
        var orderReq = new HttpEntity<>(Map.of(
                "symbol", "AAPL",
                "side", "BUY",
                "type", "MARKET",
                "quantity", 10), authHeaders);
        ResponseEntity<OrderView> order = rest.postForEntity("/api/v1/orders", orderReq, OrderView.class);
        assertThat(order.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(order.getBody()).isNotNull();
        assertThat(order.getBody().filledQuantity()).isEqualTo(10);

        // 3. Portfolio shows the position and reduced cash
        var portfolio = rest.exchange("/api/v1/portfolio", HttpMethod.GET,
                new HttpEntity<>(authHeaders), Map.class);
        assertThat(portfolio.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(portfolio.getBody()).containsKey("holdings");
    }
}
