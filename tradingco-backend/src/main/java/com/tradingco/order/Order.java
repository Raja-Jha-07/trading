package com.tradingco.order;

import com.tradingco.common.domain.BaseEntity;
import com.tradingco.matching.OrderSide;
import com.tradingco.matching.OrderType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Persistent record of an order and its lifecycle. The idempotency key makes order
 * submission safe to retry — a duplicate key returns the original order instead of
 * creating a second one.
 */
@Getter
@Setter
@Entity
@Table(name = "orders")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(nullable = false)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderSide side;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private long quantity;

    @Column(name = "filled_quantity", nullable = false)
    private long filledQuantity;

    @Column(name = "limit_price", precision = 19, scale = 4)
    private BigDecimal limitPrice;

    @Column(name = "avg_fill_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal avgFillPrice = BigDecimal.ZERO;

    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;

    @Version
    private long version;

    public Order(UUID accountId, String symbol, OrderSide side, OrderType type,
                 long quantity, BigDecimal limitPrice, String idempotencyKey) {
        this.accountId = accountId;
        this.symbol = symbol;
        this.side = side;
        this.type = type;
        this.quantity = quantity;
        this.limitPrice = limitPrice;
        this.idempotencyKey = idempotencyKey;
        this.status = OrderStatus.NEW;
        this.filledQuantity = 0;
        this.avgFillPrice = BigDecimal.ZERO;
    }

    /** Record a fill against this order and advance its status. */
    public void applyFill(long qty, BigDecimal price) {
        BigDecimal priorNotional = avgFillPrice.multiply(BigDecimal.valueOf(filledQuantity));
        BigDecimal addedNotional = price.multiply(BigDecimal.valueOf(qty));
        this.filledQuantity += qty;
        this.avgFillPrice = filledQuantity == 0
                ? BigDecimal.ZERO
                : priorNotional.add(addedNotional)
                    .divide(BigDecimal.valueOf(filledQuantity), 4, RoundingMode.HALF_UP);
        this.status = filledQuantity >= quantity ? OrderStatus.FILLED : OrderStatus.PARTIALLY_FILLED;
    }

    public long remainingQuantity() {
        return quantity - filledQuantity;
    }
}
