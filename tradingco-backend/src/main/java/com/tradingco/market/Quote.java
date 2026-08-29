package com.tradingco.market;

import java.math.BigDecimal;
import java.time.Instant;

/** A market data snapshot broadcast to subscribers. */
public record Quote(
        String symbol,
        BigDecimal price,
        BigDecimal changePercent,
        Instant timestamp
) {}
