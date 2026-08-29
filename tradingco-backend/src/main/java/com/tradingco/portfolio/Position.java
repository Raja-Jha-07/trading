package com.tradingco.portfolio;

import com.tradingco.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * A holding of a single symbol within an account, tracking quantity and average cost.
 */
@Getter
@Setter
@Entity
@Table(name = "positions", uniqueConstraints =
        @UniqueConstraint(name = "uq_position_account_symbol", columnNames = {"account_id", "symbol"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Position extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private long quantity;

    @Column(name = "avg_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal avgPrice = BigDecimal.ZERO;

    @Version
    private long version;

    public Position(UUID accountId, String symbol) {
        this.accountId = accountId;
        this.symbol = symbol;
        this.quantity = 0;
        this.avgPrice = BigDecimal.ZERO;
    }

    /** Apply a buy fill, recomputing the weighted-average cost basis. */
    public void applyBuy(long qty, BigDecimal price) {
        BigDecimal existingCost = avgPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal addedCost = price.multiply(BigDecimal.valueOf(qty));
        long newQty = quantity + qty;
        this.avgPrice = newQty == 0
                ? BigDecimal.ZERO
                : existingCost.add(addedCost).divide(BigDecimal.valueOf(newQty), 4, RoundingMode.HALF_UP);
        this.quantity = newQty;
    }

    /** Apply a sell fill, reducing quantity (cost basis per share is unchanged). */
    public void applySell(long qty) {
        this.quantity -= qty;
        if (this.quantity == 0) {
            this.avgPrice = BigDecimal.ZERO;
        }
    }
}
