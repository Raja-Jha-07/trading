package com.tradingco.order;

import com.tradingco.common.exception.BusinessException;
import com.tradingco.matching.BookOrder;
import com.tradingco.matching.Fill;
import com.tradingco.matching.MatchingService;
import com.tradingco.matching.OrderSide;
import com.tradingco.matching.OrderType;
import com.tradingco.market.MarketPriceService;
import com.tradingco.order.dto.OrderDtos.OrderView;
import com.tradingco.order.dto.OrderDtos.PlaceOrderRequest;
import com.tradingco.portfolio.Account;
import com.tradingco.portfolio.AccountRepository;
import com.tradingco.portfolio.Position;
import com.tradingco.portfolio.PositionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final TradeRepository tradeRepository;
    private final AccountRepository accountRepository;
    private final PositionRepository positionRepository;
    private final MarketPriceService priceService;
    private final MatchingService matchingService;
    private final SimpMessagingTemplate messaging;

    public OrderService(OrderRepository orderRepository,
                        TradeRepository tradeRepository,
                        AccountRepository accountRepository,
                        PositionRepository positionRepository,
                        MarketPriceService priceService,
                        MatchingService matchingService,
                        SimpMessagingTemplate messaging) {
        this.orderRepository = orderRepository;
        this.tradeRepository = tradeRepository;
        this.accountRepository = accountRepository;
        this.positionRepository = positionRepository;
        this.priceService = priceService;
        this.matchingService = matchingService;
        this.messaging = messaging;
    }

    @Transactional
    public OrderView placeOrder(UUID userId, PlaceOrderRequest req) {
        String symbol = req.symbol().toUpperCase();

        // Idempotency: a repeated key returns the original order rather than double-booking.
        if (req.idempotencyKey() != null && !req.idempotencyKey().isBlank()) {
            var existing = orderRepository.findByIdempotencyKey(req.idempotencyKey());
            if (existing.isPresent()) {
                return toView(existing.get());
            }
        }

        validateRequest(req, symbol);

        Account account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.CONFLICT, "No trading account"));

        validateBuyingPower(req, symbol, account);

        Order order = new Order(account.getId(), symbol, req.side(), req.type(),
                req.quantity(), req.limitPrice(), req.idempotencyKey());
        orderRepository.save(order);

        BookOrder taker = new BookOrder(order.getId(), account.getId(), req.side(), req.type(),
                req.limitPrice(), req.quantity(), matchingService.nextSequence());
        List<Fill> fills = matchingService.submit(symbol, taker);

        settle(order, account, fills);

        if (order.getStatus() == OrderStatus.NEW && order.getType() == OrderType.MARKET) {
            order.setStatus(OrderStatus.REJECTED); // market order with no available liquidity
        }

        orderRepository.save(order);
        accountRepository.save(account);

        OrderView view = toView(order);
        messaging.convertAndSend("/topic/orders/" + account.getId(), view);
        return view;
    }

    private void settle(Order order, Account account, List<Fill> fills) {
        for (Fill fill : fills) {
            order.applyFill(fill.quantity(), fill.price());

            BigDecimal notional = fill.price().multiply(BigDecimal.valueOf(fill.quantity()));
            Position position = positionRepository
                    .findByAccountIdAndSymbol(account.getId(), order.getSymbol())
                    .orElseGet(() -> positionRepository.save(
                            new Position(account.getId(), order.getSymbol())));

            if (order.getSide() == OrderSide.BUY) {
                account.debit(notional);
                position.applyBuy(fill.quantity(), fill.price());
            } else {
                account.credit(notional);
                position.applySell(fill.quantity());
            }
            positionRepository.save(position);

            tradeRepository.save(new Trade(order.getSymbol(), fill.price(), fill.quantity(),
                    order.getId(), fill.makerOrderId(), account.getId(), order.getSide()));
        }
    }

    private void validateRequest(PlaceOrderRequest req, String symbol) {
        if (!priceService.isKnown(symbol)) {
            throw new BusinessException("Unknown instrument: " + symbol);
        }
        if (req.type() == OrderType.LIMIT
                && (req.limitPrice() == null || req.limitPrice().signum() <= 0)) {
            throw new BusinessException("Limit orders require a positive limit price");
        }
    }

    private void validateBuyingPower(PlaceOrderRequest req, String symbol, Account account) {
        if (req.side() == OrderSide.BUY) {
            BigDecimal ref = req.type() == OrderType.LIMIT
                    ? req.limitPrice()
                    : priceService.priceOf(symbol);
            BigDecimal estimatedCost = ref.multiply(BigDecimal.valueOf(req.quantity()));
            if (account.getCashBalance().compareTo(estimatedCost) < 0) {
                throw new BusinessException("Insufficient funds for this order");
            }
        } else {
            long held = positionRepository.findByAccountIdAndSymbol(account.getId(), symbol)
                    .map(Position::getQuantity)
                    .orElse(0L);
            if (held < req.quantity()) {
                throw new BusinessException("Insufficient shares to sell");
            }
        }
    }

    @Transactional(readOnly = true)
    public List<OrderView> ordersFor(UUID userId) {
        Account account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.CONFLICT, "No trading account"));
        return orderRepository.findByAccountIdOrderByCreatedAtDesc(account.getId())
                .stream().map(OrderService::toView).toList();
    }

    static OrderView toView(Order o) {
        return new OrderView(o.getId(), o.getSymbol(), o.getSide(), o.getType(), o.getStatus(),
                o.getQuantity(), o.getFilledQuantity(), o.getLimitPrice(), o.getAvgFillPrice(),
                o.getCreatedAt());
    }
}
