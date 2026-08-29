package com.tradingco.matching;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Pure price-time-priority matching algorithm. Framework-free and deterministic so it can be
 * unit-tested in isolation. Callers are responsible for serializing access to a given
 * {@link OrderBook} (see {@code MatchingService}).
 */
public final class MatchingEngine {

    /**
     * Match an incoming (taker) order against the resting side of the book.
     *
     * <ul>
     *   <li>Trades execute at the resting maker's price (price improvement to the taker).</li>
     *   <li>A LIMIT taker only crosses while price is acceptable; its remainder rests.</li>
     *   <li>A MARKET taker crosses at any price; its remainder is discarded.</li>
     * </ul>
     *
     * @return the list of fills produced, in execution order.
     */
    public List<Fill> match(OrderBook book, BookOrder taker) {
        List<Fill> fills = new ArrayList<>();
        TreeMap<BigDecimal, Deque<BookOrder>> opposite = book.opposite(taker.side());

        while (!taker.isFilled() && !opposite.isEmpty()) {
            Map.Entry<BigDecimal, Deque<BookOrder>> bestLevel = opposite.firstEntry();
            BigDecimal makerPrice = bestLevel.getKey();

            if (!crosses(taker, makerPrice)) {
                break; // best price no longer acceptable for a LIMIT taker
            }

            Deque<BookOrder> queue = bestLevel.getValue();
            while (!taker.isFilled() && !queue.isEmpty()) {
                BookOrder maker = queue.peekFirst();
                long tradedQty = Math.min(taker.remainingQuantity(), maker.remainingQuantity());

                taker.reduceBy(tradedQty);
                maker.reduceBy(tradedQty);

                fills.add(new Fill(
                        taker.id(), maker.id(),
                        taker.accountId(), maker.accountId(),
                        taker.side(), makerPrice, tradedQty));

                if (maker.isFilled()) {
                    queue.pollFirst();
                }
            }

            if (queue.isEmpty()) {
                opposite.remove(makerPrice);
            }
        }

        // A LIMIT order with unfilled quantity joins the book as a resting maker.
        if (!taker.isFilled() && taker.type() == OrderType.LIMIT) {
            book.rest(taker);
        }

        return fills;
    }

    private boolean crosses(BookOrder taker, BigDecimal makerPrice) {
        if (taker.type() == OrderType.MARKET) {
            return true;
        }
        return taker.side() == OrderSide.BUY
                ? taker.limitPrice().compareTo(makerPrice) >= 0   // willing to pay at least maker's ask
                : taker.limitPrice().compareTo(makerPrice) <= 0;  // willing to sell at most maker's bid
    }
}
