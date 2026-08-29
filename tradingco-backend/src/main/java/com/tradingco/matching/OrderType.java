package com.tradingco.matching;

/** Order execution style. */
public enum OrderType {
    /** Execute immediately at best available price; unfilled remainder is dropped. */
    MARKET,
    /** Execute at limit price or better; unfilled remainder rests in the book. */
    LIMIT
}
