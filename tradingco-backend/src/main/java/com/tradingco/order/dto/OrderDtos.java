package com.tradingco.order.dto;

import com.tradingco.matching.OrderSide;
import com.tradingco.matching.OrderType;
import com.tradingco.order.OrderStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class OrderDtos {

    public record PlaceOrderRequest(
            @NotBlank String symbol,
            @NotNull OrderSide side,
            @NotNull OrderType type,
            @Positive long quantity,
            BigDecimal limitPrice,          // required for LIMIT orders
            String idempotencyKey           // optional; enables safe retries
    ) {}

    public record OrderView(
            UUID id,
            String symbol,
            OrderSide side,
            OrderType type,
            OrderStatus status,
            long quantity,
            long filledQuantity,
            BigDecimal limitPrice,
            BigDecimal avgFillPrice,
            Instant createdAt
    ) {}
}
