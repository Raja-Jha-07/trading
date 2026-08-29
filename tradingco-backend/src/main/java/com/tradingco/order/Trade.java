package com.tradingco.order;

import com.tradingco.common.domain.BaseEntity;
import com.tradingco.matching.OrderSide;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Immutable record of an executed trade from the perspective of the taker account.
 */
@Getter
@Setter
@Entity
@Table(name = "trades")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Trade extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal price;

    @Column(nullable = false)
    private long quantity;

    @Column(name = "taker_order_id", nullable = false)
    private UUID takerOrderId;

    @Column(name = "maker_order_id")
    private UUID makerOrderId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderSide side;

    public Trade(String symbol, BigDecimal price, long quantity, UUID takerOrderId,
                 UUID makerOrderId, UUID accountId, OrderSide side) {
        this.symbol = symbol;
        this.price = price;
        this.quantity = quantity;
        this.takerOrderId = takerOrderId;
        this.makerOrderId = makerOrderId;
        this.accountId = accountId;
        this.side = side;
    }
}
