package com.tradingco.matching;

import com.tradingco.market.MarketPriceService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Owns one {@link OrderBook} per symbol and guarantees that matching for a given symbol is
 * serialized via a per-symbol lock — this is the core concurrency guarantee: two orders for
 * the same symbol can never be matched simultaneously, so a resting quantity is never
 * double-filled. Settlement (DB writes) adds a second safety layer via optimistic locking.
 *
 * <p>A synthetic market maker seeds resting liquidity around the current price so that a lone
 * user always receives realistic fills.
 */
@Service
public class MatchingService {

    /** Synthetic counterparty; its fills are not settled against a real account. */
    public static final UUID MARKET_MAKER_ACCOUNT =
            UUID.fromString("00000000-0000-0000-0000-0000000000ff");

    private static final int LIQUIDITY_LEVELS = 5;
    private static final long LIQUIDITY_SIZE = 500;
    private static final BigDecimal SPREAD_PCT = new BigDecimal("0.001"); // 0.1%

    private final MarketPriceService priceService;
    private final MatchingEngine engine = new MatchingEngine();
    private final Map<String, OrderBook> books = new ConcurrentHashMap<>();
    private final Map<String, ReentrantLock> locks = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong();

    public MatchingService(MarketPriceService priceService) {
        this.priceService = priceService;
    }

    public long nextSequence() {
        return sequence.incrementAndGet();
    }

    /**
     * Submit a taker order for matching. Serialized per symbol.
     */
    public List<Fill> submit(String symbol, BookOrder taker) {
        ReentrantLock lock = locks.computeIfAbsent(symbol, s -> new ReentrantLock());
        lock.lock();
        try {
            OrderBook book = books.computeIfAbsent(symbol, OrderBook::new);
            replenishLiquidity(book, symbol);
            return engine.match(book, taker);
        } finally {
            lock.unlock();
        }
    }

    public OrderBook bookFor(String symbol) {
        return books.computeIfAbsent(symbol, OrderBook::new);
    }

    /** Top-of-book snapshot for the read API. */
    public Depth depth(String symbol) {
        ReentrantLock lock = locks.computeIfAbsent(symbol, s -> new ReentrantLock());
        lock.lock();
        try {
            OrderBook book = books.computeIfAbsent(symbol, OrderBook::new);
            replenishLiquidity(book, symbol);
            return new Depth(symbol, book.bestBid().orElse(null), book.bestAsk().orElse(null),
                    book.totalResting());
        } finally {
            lock.unlock();
        }
    }

    private void replenishLiquidity(OrderBook book, String symbol) {
        BigDecimal mid = priceService.priceOf(symbol);
        if (mid == null) {
            return;
        }
        boolean needBids = book.bestBid().isEmpty();
        boolean needAsks = book.bestAsk().isEmpty();
        if (!needBids && !needAsks) {
            return;
        }
        for (int level = 1; level <= LIQUIDITY_LEVELS; level++) {
            BigDecimal offset = mid.multiply(SPREAD_PCT).multiply(BigDecimal.valueOf(level));
            if (needAsks) {
                BigDecimal askPrice = mid.add(offset).setScale(4, RoundingMode.HALF_UP);
                book.rest(new BookOrder(UUID.randomUUID(), MARKET_MAKER_ACCOUNT,
                        OrderSide.SELL, OrderType.LIMIT, askPrice, LIQUIDITY_SIZE, nextSequence()));
            }
            if (needBids) {
                BigDecimal bidPrice = mid.subtract(offset).setScale(4, RoundingMode.HALF_UP);
                if (bidPrice.signum() > 0) {
                    book.rest(new BookOrder(UUID.randomUUID(), MARKET_MAKER_ACCOUNT,
                            OrderSide.BUY, OrderType.LIMIT, bidPrice, LIQUIDITY_SIZE, nextSequence()));
                }
            }
        }
    }

    /** Top-of-book depth snapshot. */
    public record Depth(String symbol, BigDecimal bestBid, BigDecimal bestAsk, long restingOrders) {}
}
