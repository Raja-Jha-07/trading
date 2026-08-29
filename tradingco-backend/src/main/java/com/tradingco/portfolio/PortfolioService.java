package com.tradingco.portfolio;

import com.tradingco.auth.UserRegisteredEvent;
import com.tradingco.config.AppProperties;
import com.tradingco.instrument.Instrument;
import com.tradingco.instrument.InstrumentRepository;
import com.tradingco.portfolio.dto.PortfolioDtos.HoldingView;
import com.tradingco.portfolio.dto.PortfolioDtos.PortfolioView;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PortfolioService {

    private final AccountRepository accountRepository;
    private final PositionRepository positionRepository;
    private final InstrumentRepository instrumentRepository;
    private final AppProperties.Market marketProps;

    public PortfolioService(AccountRepository accountRepository,
                            PositionRepository positionRepository,
                            InstrumentRepository instrumentRepository,
                            AppProperties.Market marketProps) {
        this.accountRepository = accountRepository;
        this.positionRepository = positionRepository;
        this.instrumentRepository = instrumentRepository;
        this.marketProps = marketProps;
    }

    /** Bootstrap a funded account when a user registers. */
    @EventListener
    @Transactional
    public void onUserRegistered(UserRegisteredEvent event) {
        if (accountRepository.findByUserId(event.userId()).isEmpty()) {
            accountRepository.save(new Account(event.userId(), marketProps.startingCash()));
        }
    }

    @Transactional(readOnly = true)
    public Account requireAccount(UUID userId) {
        return accountRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Account missing for user " + userId));
    }

    @Transactional(readOnly = true)
    public PortfolioView getPortfolio(UUID userId) {
        Account account = requireAccount(userId);
        List<Position> positions = positionRepository.findByAccountId(account.getId());

        Map<String, BigDecimal> prices = new HashMap<>();
        for (Instrument i : instrumentRepository.findAll()) {
            prices.put(i.getSymbol(), i.getLastPrice());
        }

        BigDecimal holdingsValue = BigDecimal.ZERO;
        var holdings = new java.util.ArrayList<HoldingView>();
        for (Position p : positions) {
            if (p.getQuantity() == 0) {
                continue;
            }
            BigDecimal last = prices.getOrDefault(p.getSymbol(), p.getAvgPrice());
            BigDecimal marketValue = last.multiply(BigDecimal.valueOf(p.getQuantity()));
            BigDecimal costBasis = p.getAvgPrice().multiply(BigDecimal.valueOf(p.getQuantity()));
            BigDecimal unrealizedPnl = marketValue.subtract(costBasis);
            holdingsValue = holdingsValue.add(marketValue);
            holdings.add(new HoldingView(
                    p.getSymbol(), p.getQuantity(), p.getAvgPrice(), last, marketValue, unrealizedPnl));
        }

        BigDecimal equity = account.getCashBalance().add(holdingsValue);
        return new PortfolioView(account.getCashBalance(), holdingsValue, equity, holdings);
    }
}
