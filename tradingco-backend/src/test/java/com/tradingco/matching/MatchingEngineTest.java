package com.tradingco.matching;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the pure price-time-priority matching algorithm.
 */
class MatchingEngineTest {

    private final MatchingEngine engine = new MatchingEngine();
    private long seq = 0;

    private BookOrder limit(OrderSide side, String price, long qty) {
        return new BookOrder(UUID.randomUUID(), UUID.randomUUID(), side, OrderType.LIMIT,
                new BigDecimal(price), qty, ++seq);
    }

    private BookOrder market(OrderSide side, long qty) {
        return new BookOrder(UUID.randomUUID(), UUID.randomUUID(), side, OrderType.MARKET,
                null, qty, ++seq);
    }

    @Test
    void limitBuyMatchesRestingAskAtMakerPrice() {
        OrderBook book = new OrderBook("AAPL");
        book.rest(limit(OrderSide.SELL, "100.00", 50));

        List<Fill> fills = engine.match(book, limit(OrderSide.BUY, "101.00", 50));

        assertThat(fills).hasSize(1);
        assertThat(fills.get(0).quantity()).isEqualTo(50);
        // Trade executes at the resting maker's price (price improvement to the taker).
        assertThat(fills.get(0).price()).isEqualByComparingTo("100.00");
        assertThat(book.bestAsk()).isEmpty();
    }

    @Test
    void nonCrossingLimitRestsInBook() {
        OrderBook book = new OrderBook("AAPL");
        book.rest(limit(OrderSide.SELL, "105.00", 10));

        List<Fill> fills = engine.match(book, limit(OrderSide.BUY, "100.00", 10));

        assertThat(fills).isEmpty();
        assertThat(book.bestBid()).hasValue(new BigDecimal("100.00"));
        assertThat(book.bestAsk()).hasValue(new BigDecimal("105.00"));
    }

    @Test
    void marketOrderSweepsMultiplePriceLevels() {
        OrderBook book = new OrderBook("AAPL");
        book.rest(limit(OrderSide.SELL, "100.00", 30));
        book.rest(limit(OrderSide.SELL, "101.00", 30));

        List<Fill> fills = engine.match(book, market(OrderSide.BUY, 50));

        assertThat(fills).hasSize(2);
        assertThat(fills.get(0).price()).isEqualByComparingTo("100.00");
        assertThat(fills.get(0).quantity()).isEqualTo(30);
        assertThat(fills.get(1).price()).isEqualByComparingTo("101.00");
        assertThat(fills.get(1).quantity()).isEqualTo(20);
    }

    @Test
    void timePriorityIsRespectedWithinAPriceLevel() {
        OrderBook book = new OrderBook("AAPL");
        BookOrder first = limit(OrderSide.SELL, "100.00", 10);
        BookOrder second = limit(OrderSide.SELL, "100.00", 10);
        book.rest(first);
        book.rest(second);

        List<Fill> fills = engine.match(book, market(OrderSide.BUY, 10));

        assertThat(fills).hasSize(1);
        // The earlier-resting order (first) must fill before the later one.
        assertThat(fills.get(0).makerOrderId()).isEqualTo(first.id());
    }

    @Test
    void partialFillLeavesRemainderResting() {
        OrderBook book = new OrderBook("AAPL");
        book.rest(limit(OrderSide.SELL, "100.00", 10));

        List<Fill> fills = engine.match(book, limit(OrderSide.BUY, "100.00", 25));

        assertThat(fills).hasSize(1);
        assertThat(fills.get(0).quantity()).isEqualTo(10);
        // Remaining 15 of the buy rests as the new best bid.
        assertThat(book.bestBid()).hasValue(new BigDecimal("100.00"));
    }
}
