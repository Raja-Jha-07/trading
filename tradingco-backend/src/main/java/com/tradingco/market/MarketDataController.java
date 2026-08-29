package com.tradingco.market;

import com.tradingco.common.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Market Data")
@RestController
@RequestMapping("/api/v1/market")
public class MarketDataController {

    private final MarketPriceService priceService;

    public MarketDataController(MarketPriceService priceService) {
        this.priceService = priceService;
    }

    @Operation(summary = "Snapshot of current quotes for all instruments")
    @GetMapping("/quotes")
    public List<Quote> quotes() {
        return priceService.snapshot();
    }

    @Operation(summary = "Current quote for a single symbol")
    @GetMapping("/quotes/{symbol}")
    public Quote quote(@PathVariable String symbol) {
        String upper = symbol.toUpperCase();
        if (!priceService.isKnown(upper)) {
            throw new NotFoundException("Unknown instrument: " + symbol);
        }
        return priceService.snapshot().stream()
                .filter(q -> q.symbol().equals(upper))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Unknown instrument: " + symbol));
    }
}
