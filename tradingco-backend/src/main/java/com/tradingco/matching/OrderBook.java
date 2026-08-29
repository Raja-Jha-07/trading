package com.tradingco.matching;

import java.math.BigDecimal;
import java.util.ArrayDeque;
import java.util.Comparator;
import java.util.Deque;
import java.util.Optional;
import java.util.TreeMap;

/**
 * A single-symbol limit order book with price-time priority.
 *
 * <p>Bids are ordered by highest price first; asks by lowest price first. Within a price
 * level, orders are FIFO (earliest sequence fills first). This class is NOT thread-safe by
 * itself — the {@link MatchingEngine} serializes access per symbol.
 */
public final class OrderBook {

    private final String symbol;

    // Price level -> FIFO queue of resting orders.
    private final TreeMap<BigDecimal, Deque<BookOrder>> bids =
            new TreeMap<>(Comparator.reverseOrder());
    private final TreeMap<BigDecimal, Deque<BookOrder>> asks =
            new TreeMap<>(Comparator.naturalOrder());

    public OrderBook(String symbol) {
        this.symbol = symbol;
    }

    public String symbol() {
        return symbol;
    }

    TreeMap<BigDecimal, Deque<BookOrder>> opposite(OrderSide takerSide) {
        return takerSide == OrderSide.BUY ? asks : bids;
    }

    void rest(BookOrder order) {
        TreeMap<BigDecimal, Deque<BookOrder>> side =
                order.side() == OrderSide.BUY ? bids : asks;
        side.computeIfAbsent(order.limitPrice(), p -> new ArrayDeque<>()).addLast(order);
    }

    /** Best (highest) bid price currently resting, if any. */
    public Optional<BigDecimal> bestBid() {
        return bids.isEmpty() ? Optional.empty() : Optional.of(bids.firstKey());
    }

    /** Best (lowest) ask price currently resting, if any. */
    public Optional<BigDecimal> bestAsk() {
        return asks.isEmpty() ? Optional.empty() : Optional.of(asks.firstKey());
    }

    public long totalResting() {
        long count = 0;
        for (Deque<BookOrder> level : bids.values()) count += level.size();
        for (Deque<BookOrder> level : asks.values()) count += level.size();
        return count;
    }

    TreeMap<BigDecimal, Deque<BookOrder>> bids() {
        return bids;
    }

    TreeMap<BigDecimal, Deque<BookOrder>> asks() {
        return asks;
    }
}
