package com.tradingco.portfolio.dto;

import java.math.BigDecimal;
import java.util.List;

public class PortfolioDtos {

    public record HoldingView(
            String symbol,
            long quantity,
            BigDecimal avgPrice,
            BigDecimal lastPrice,
            BigDecimal marketValue,
            BigDecimal unrealizedPnl
    ) {}

    public record PortfolioView(
            BigDecimal cashBalance,
            BigDecimal holdingsValue,
            BigDecimal equity,
            List<HoldingView> holdings
    ) {}
}
