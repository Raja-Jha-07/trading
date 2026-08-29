package com.tradingco.auth;

import com.tradingco.auth.dto.AuthDtos.LoginRequest;
import com.tradingco.auth.dto.AuthDtos.RegisterRequest;
import com.tradingco.auth.dto.AuthDtos.TokenResponse;
import com.tradingco.common.exception.BusinessException;
import com.tradingco.config.AppProperties;
import com.tradingco.user.Role;
import com.tradingco.user.User;
import com.tradingco.user.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AppProperties.Jwt jwtProps;
    private final ApplicationEventPublisher events;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AppProperties.Jwt jwtProps,
                       ApplicationEventPublisher events) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProps = jwtProps;
        this.events = events;
    }

    @Transactional
    public TokenResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = new User(req.email(), req.displayName(), passwordEncoder.encode(req.password()));
        userRepository.save(user);
        events.publishEvent(new UserRegisteredEvent(user.getId()));
        return issueTokens(user);
    }

    @Transactional
    public TokenResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return issueTokens(user);
    }

    @Transactional
    public TokenResponse refresh(String rawRefreshToken) {
        String hash = sha256(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (!stored.isActive()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked");
        }
        // Rotation: revoke the used token and issue a fresh pair.
        stored.setRevoked(true);
        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "User no longer exists"));
        return issueTokens(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenRepository.findByTokenHash(sha256(rawRefreshToken))
                .ifPresent(t -> t.setRevoked(true));
    }

    private TokenResponse issueTokens(User user) {
        List<String> roles = user.getRoles().stream().map(Role::name).toList();
        String access = jwtService.generateAccessToken(user.getId(), user.getEmail(), roles);

        String rawRefresh = generateRefreshToken();
        Instant expiry = Instant.now().plus(jwtProps.refreshTokenTtl());
        refreshTokenRepository.save(new RefreshToken(user.getId(), sha256(rawRefresh), expiry));

        return new TokenResponse(access, rawRefresh, "Bearer", jwtProps.accessTokenTtl().toSeconds());
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[48];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
