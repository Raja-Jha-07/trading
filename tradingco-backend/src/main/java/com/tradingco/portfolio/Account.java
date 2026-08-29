package com.tradingco.portfolio;

import com.tradingco.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import java.util.UUID;

/**
 * A user's trading account holding simulated cash. Guarded by an optimistic lock
 * ({@link Version}) so concurrent settlements cannot silently overwrite the balance.
 */
@Getter
@Setter
@Entity
@Table(name = "accounts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Account extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "cash_balance", nullable = false, precision = 19, scale = 4)
    private BigDecimal cashBalance;

    @Version
    private long version;

    public Account(UUID userId, BigDecimal startingCash) {
        this.userId = userId;
        this.cashBalance = startingCash;
    }

    public void debit(BigDecimal amount) {
        this.cashBalance = this.cashBalance.subtract(amount);
    }

    public void credit(BigDecimal amount) {
        this.cashBalance = this.cashBalance.add(amount);
    }
}
