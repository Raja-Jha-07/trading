package com.tradingco.matching;

import com.tradingco.market.MarketPriceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.tradingco.common.exception.NotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Order Book")
@RestController
@RequestMapping("/api/v1/orderbook")
public class OrderBookController {

    private final MatchingService matchingService;
    private final MarketPriceService priceService;

    public OrderBookController(MatchingService matchingService, MarketPriceService priceService) {
        this.matchingService = matchingService;
        this.priceService = priceService;
    }

    @Operation(summary = "Top-of-book bid/ask depth for a symbol")
    @GetMapping("/{symbol}")
    public MatchingService.Depth depth(@PathVariable String symbol) {
        String upper = symbol.toUpperCase();
        if (!priceService.isKnown(upper)) {
            throw new NotFoundException("Unknown instrument: " + symbol);
        }
        return matchingService.depth(upper);
    }
}
