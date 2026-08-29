package com.tradingco.common.ratelimit;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Minimal thread-safe token bucket. Refills continuously at {@code refillPerSecond} up to
 * {@code capacity}. Dependency-free so it can guard hot endpoints without extra libraries.
 */
public final class TokenBucket {

    private final long capacity;
    private final double refillPerMilli;
    private final AtomicLong availableNanos; // tokens stored as micro-units for atomic math
    private volatile long lastRefillMillis;

    private static final long SCALE = 1000L;

    public TokenBucket(long capacity, double refillPerSecond) {
        this.capacity = capacity;
        this.refillPerMilli = refillPerSecond / 1000.0;
        this.availableNanos = new AtomicLong(capacity * SCALE);
        this.lastRefillMillis = System.currentTimeMillis();
    }

    public synchronized boolean tryConsume() {
        refill();
        long current = availableNanos.get();
        if (current >= SCALE) {
            availableNanos.set(current - SCALE);
            return true;
        }
        return false;
    }

    private void refill() {
        long now = System.currentTimeMillis();
        long elapsed = now - lastRefillMillis;
        if (elapsed <= 0) {
            return;
        }
        long refill = (long) (elapsed * refillPerMilli * SCALE);
        if (refill > 0) {
            long updated = Math.min(capacity * SCALE, availableNanos.get() + refill);
            availableNanos.set(updated);
            lastRefillMillis = now;
        }
    }
}
