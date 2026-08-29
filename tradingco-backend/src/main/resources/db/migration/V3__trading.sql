-- V3: Trading — accounts, positions, orders, trades

CREATE TABLE accounts (
    id           UUID PRIMARY KEY,
    user_id      UUID           NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    cash_balance NUMERIC(19, 4) NOT NULL,
    version      BIGINT         NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ    NOT NULL,
    updated_at   TIMESTAMPTZ    NOT NULL
);

CREATE TABLE positions (
    id          UUID PRIMARY KEY,
    account_id  UUID           NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    symbol      VARCHAR(16)    NOT NULL,
    quantity    BIGINT         NOT NULL DEFAULT 0,
    avg_price   NUMERIC(19, 4) NOT NULL DEFAULT 0,
    version     BIGINT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ    NOT NULL,
    updated_at  TIMESTAMPTZ    NOT NULL,
    CONSTRAINT uq_position_account_symbol UNIQUE (account_id, symbol)
);

CREATE TABLE orders (
    id              UUID PRIMARY KEY,
    account_id      UUID           NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    symbol          VARCHAR(16)    NOT NULL,
    side            VARCHAR(8)     NOT NULL,     -- BUY / SELL
    type            VARCHAR(8)     NOT NULL,     -- MARKET / LIMIT
    status          VARCHAR(16)    NOT NULL,     -- NEW / PARTIALLY_FILLED / FILLED / CANCELLED / REJECTED
    quantity        BIGINT         NOT NULL,
    filled_quantity BIGINT         NOT NULL DEFAULT 0,
    limit_price     NUMERIC(19, 4),
    avg_fill_price  NUMERIC(19, 4) NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(80)    UNIQUE,
    version         BIGINT         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ    NOT NULL,
    updated_at      TIMESTAMPTZ    NOT NULL
);

CREATE INDEX idx_orders_account ON orders (account_id);
CREATE INDEX idx_orders_symbol_status ON orders (symbol, status);

CREATE TABLE trades (
    id           UUID PRIMARY KEY,
    symbol       VARCHAR(16)    NOT NULL,
    price        NUMERIC(19, 4) NOT NULL,
    quantity     BIGINT         NOT NULL,
    taker_order_id UUID         NOT NULL,
    maker_order_id UUID,
    account_id   UUID           NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    side         VARCHAR(8)     NOT NULL,
    created_at   TIMESTAMPTZ    NOT NULL,
    updated_at   TIMESTAMPTZ    NOT NULL
);

CREATE INDEX idx_trades_account ON trades (account_id);
CREATE INDEX idx_trades_symbol ON trades (symbol);
