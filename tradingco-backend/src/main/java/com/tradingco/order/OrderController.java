package com.tradingco.order;

import com.tradingco.auth.UserPrincipal;
import com.tradingco.order.dto.OrderDtos.OrderView;
import com.tradingco.order.dto.OrderDtos.PlaceOrderRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Orders")
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "Place an order (market or limit) and match it against the book")
    @PostMapping
    public ResponseEntity<OrderView> place(@AuthenticationPrincipal UserPrincipal principal,
                                           @Valid @RequestBody PlaceOrderRequest req) {
        OrderView view = orderService.placeOrder(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(view);
    }

    @Operation(summary = "List the authenticated user's orders, newest first")
    @GetMapping
    public List<OrderView> myOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return orderService.ordersFor(principal.getId());
    }
}
