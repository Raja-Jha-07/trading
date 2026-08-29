package com.tradingco.matching;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * A live order resting in (or crossing) the book. Framework-free and mutable:
 * {@code remainingQuantity} shrinks as the order is filled.
 */
public final class BookOrder {

    private final UUID id;
    private final UUID accountId;
    private final OrderSide side;
    private final OrderType type;
    private final BigDecimal limitPrice; // null for MARKET orders
    private final long sequence;         // monotonic — enforces time priority
    private long remainingQuantity;

    public BookOrder(UUID id, UUID accountId, OrderSide side, OrderType type,
                     BigDecimal limitPrice, long quantity, long sequence) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (type == OrderType.LIMIT && limitPrice == null) {
            throw new IllegalArgumentException("Limit orders require a price");
        }
        this.id = id;
        this.accountId = accountId;
        this.side = side;
        this.type = type;
        this.limitPrice = limitPrice;
        this.remainingQuantity = quantity;
        this.sequence = sequence;
    }

    public UUID id() {
        return id;
    }

    public UUID accountId() {
        return accountId;
    }

    public OrderSide side() {
        return side;
    }

    public OrderType type() {
        return type;
    }

    public BigDecimal limitPrice() {
        return limitPrice;
    }

    public long sequence() {
        return sequence;
    }

    public long remainingQuantity() {
        return remainingQuantity;
    }

    void reduceBy(long qty) {
        if (qty > remainingQuantity) {
            throw new IllegalArgumentException("Cannot fill more than remaining quantity");
        }
        this.remainingQuantity -= qty;
    }

    public boolean isFilled() {
        return remainingQuantity == 0;
    }
}
