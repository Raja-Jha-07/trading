package com.tradingco.common.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-client rate limiting for sensitive endpoints (auth + order placement) using an
 * in-memory token bucket keyed by client IP. Protects against brute force and abuse.
 */
@Order(1)
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Map<String, TokenBucket> BUCKETS = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        if (!isRateLimited(request)) {
            chain.doFilter(request, response);
            return;
        }

        String key = clientKey(request);
        TokenBucket bucket = BUCKETS.computeIfAbsent(key, k -> new TokenBucket(20, 5)); // 20 burst, 5/s
        if (bucket.tryConsume()) {
            chain.doFilter(request, response);
        } else {
            writeTooManyRequests(response);
        }
    }

    private boolean isRateLimited(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/v1/auth/") || path.startsWith("/api/v1/orders");
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
        return ip + ":" + request.getRequestURI();
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded — slow down");
        pd.setType(URI.create("urn:tradingco:rate-limit"));
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(),
                Map.of("type", pd.getType().toString(),
                        "title", "Too Many Requests",
                        "status", 429,
                        "detail", pd.getDetail()));
    }
}
