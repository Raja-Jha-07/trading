package com.tradingco.market;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Emits fresh quotes to /topic/quotes on a fixed interval so connected clients see
 * live price movement over STOMP.
 */
@Component
public class MarketDataPublisher {

    private final MarketPriceService priceService;
    private final SimpMessagingTemplate messaging;

    public MarketDataPublisher(MarketPriceService priceService, SimpMessagingTemplate messaging) {
        this.priceService = priceService;
        this.messaging = messaging;
    }

    @Scheduled(fixedRateString = "${tradingco.market.tick-interval-ms}")
    public void publishTick() {
        List<Quote> quotes = priceService.tick();
        messaging.convertAndSend("/topic/quotes", quotes);
    }
}
