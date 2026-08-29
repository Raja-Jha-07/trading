package com.tradingco.matching;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * The result of one match: {@code quantity} of the symbol changed hands at {@code price}
 * between the incoming taker order and a resting maker order.
 */
public record Fill(
        UUID takerOrderId,
        UUID makerOrderId,
        UUID takerAccountId,
        UUID makerAccountId,
        OrderSide takerSide,
        BigDecimal price,
        long quantity
) {}
