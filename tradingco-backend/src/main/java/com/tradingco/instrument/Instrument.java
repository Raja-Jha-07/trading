package com.tradingco.instrument;

import com.tradingco.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * A tradable symbol (equity) with a simulated last price.
 */
@Getter
@Setter
@Entity
@Table(name = "instruments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Instrument extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String symbol;

    @Column(nullable = false)
    private String name;

    @Column(name = "last_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal lastPrice;

    public Instrument(String symbol, String name, BigDecimal lastPrice) {
        this.symbol = symbol;
        this.name = name;
        this.lastPrice = lastPrice;
    }
}
