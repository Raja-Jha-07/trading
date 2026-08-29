package com.tradingco.matching;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The critical correctness test: fire many concurrent buy orders at a single, fixed pool of
 * resting liquidity and assert that the TOTAL filled quantity never exceeds what was available.
 *
 * <p>This mirrors how {@code MatchingService} serializes matching per symbol with a lock. Without
 * that serialization, concurrent {@code match()} calls would race on the shared book and
 * over-fill the resting order (selling shares that don't exist).
 */
class MatchingConcurrencyTest {

    @Test
    void concurrentBuyersNeverOverfillRestingLiquidity() throws Exception {
        MatchingEngine engine = new MatchingEngine();
        OrderBook book = new OrderBook("AAPL");
        ReentrantLock symbolLock = new ReentrantLock(); // same guarantee as MatchingService

        long availableQty = 100;
        book.rest(new BookOrder(UUID.randomUUID(), UUID.randomUUID(), OrderSide.SELL,
                OrderType.LIMIT, new BigDecimal("100.00"), availableQty, 0));

        int concurrentBuyers = 200; // far more demand than supply
        AtomicLong totalFilled = new AtomicLong(0);

        try (ExecutorService pool = Executors.newFixedThreadPool(16)) {
            List<Future<Long>> futures = new ArrayList<>();
            for (int i = 0; i < concurrentBuyers; i++) {
                final long seq = i + 1;
                futures.add(pool.submit(() -> {
                    BookOrder taker = new BookOrder(UUID.randomUUID(), UUID.randomUUID(),
                            OrderSide.BUY, OrderType.MARKET, null, 1, seq);
                    symbolLock.lock();
                    try {
                        List<Fill> fills = engine.match(book, taker);
                        return fills.stream().mapToLong(Fill::quantity).sum();
                    } finally {
                        symbolLock.unlock();
                    }
                }));
            }
            for (Future<Long> f : futures) {
                totalFilled.addAndGet(f.get());
            }
        }

        // Exactly the available liquidity was sold — never more, never double-filled.
        assertThat(totalFilled.get()).isEqualTo(availableQty);
        assertThat(book.bestAsk()).isEmpty();
    }
}
