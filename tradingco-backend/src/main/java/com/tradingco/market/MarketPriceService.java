package com.tradingco.market;

import com.tradingco.instrument.Instrument;
import com.tradingco.instrument.InstrumentRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Holds live simulated prices in memory (seeded from the instrument table) and evolves
 * them with a small random walk on each tick. Acts as the single source of truth for the
 * "current" price used by market orders and portfolio valuation.
 */
@Service
public class MarketPriceService {

    private final InstrumentRepository instrumentRepository;
    private final Map<String, BigDecimal> currentPrices = new ConcurrentHashMap<>();
    private final Map<String, BigDecimal> openPrices = new ConcurrentHashMap<>();

    public MarketPriceService(InstrumentRepository instrumentRepository) {
        this.instrumentRepository = instrumentRepository;
    }

    @PostConstruct
    void seed() {
        for (Instrument i : instrumentRepository.findAll()) {
            currentPrices.put(i.getSymbol(), i.getLastPrice());
            openPrices.put(i.getSymbol(), i.getLastPrice());
        }
    }

    public BigDecimal priceOf(String symbol) {
        return currentPrices.get(symbol);
    }

    public boolean isKnown(String symbol) {
        return currentPrices.containsKey(symbol);
    }

    /** Advance every price by a small random percentage and return fresh quotes. */
    public List<Quote> tick() {
        List<Quote> quotes = new ArrayList<>();
        for (var entry : currentPrices.entrySet()) {
            String symbol = entry.getKey();
            BigDecimal price = entry.getValue();
            double driftPct = ThreadLocalRandom.current().nextDouble(-0.004, 0.004);
            BigDecimal next = price.add(price.multiply(BigDecimal.valueOf(driftPct)))
                    .setScale(4, RoundingMode.HALF_UP);
            if (next.signum() <= 0) {
                next = price;
            }
            currentPrices.put(symbol, next);
            quotes.add(toQuote(symbol, next));
        }
        return quotes;
    }

    public List<Quote> snapshot() {
        List<Quote> quotes = new ArrayList<>();
        currentPrices.forEach((symbol, price) -> quotes.add(toQuote(symbol, price)));
        return quotes;
    }

    private Quote toQuote(String symbol, BigDecimal price) {
        BigDecimal open = openPrices.getOrDefault(symbol, price);
        BigDecimal changePct = open.signum() == 0
                ? BigDecimal.ZERO
                : price.subtract(open).divide(open, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        return new Quote(symbol, price, changePct, java.time.Instant.now());
    }
}
