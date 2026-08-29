package com.tradingco.instrument;

import com.tradingco.common.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Instruments")
@RestController
@RequestMapping("/api/v1/instruments")
public class InstrumentController {

    private final InstrumentRepository repository;

    public InstrumentController(InstrumentRepository repository) {
        this.repository = repository;
    }

    @Operation(summary = "List all tradable instruments")
    @GetMapping
    public List<Instrument> list() {
        return repository.findAll();
    }

    @Operation(summary = "Get a single instrument by symbol")
    @GetMapping("/{symbol}")
    public Instrument get(@PathVariable String symbol) {
        return repository.findBySymbol(symbol.toUpperCase())
                .orElseThrow(() -> new NotFoundException("Unknown instrument: " + symbol));
    }
}
