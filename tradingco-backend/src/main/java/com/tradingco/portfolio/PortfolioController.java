package com.tradingco.portfolio;

import com.tradingco.auth.UserPrincipal;
import com.tradingco.portfolio.dto.PortfolioDtos.PortfolioView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Portfolio")
@RestController
@RequestMapping("/api/v1/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @Operation(summary = "Get the authenticated user's portfolio with live P&L")
    @GetMapping
    public PortfolioView myPortfolio(@AuthenticationPrincipal UserPrincipal principal) {
        return portfolioService.getPortfolio(principal.getId());
    }
}
