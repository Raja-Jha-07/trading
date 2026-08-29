-- V2: Tradable instruments + seed universe

CREATE TABLE instruments (
    id         UUID PRIMARY KEY,
    symbol     VARCHAR(16)   NOT NULL UNIQUE,
    name       VARCHAR(120)  NOT NULL,
    last_price NUMERIC(19, 4) NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL,
    updated_at TIMESTAMPTZ   NOT NULL
);

INSERT INTO instruments (id, symbol, name, last_price, created_at, updated_at) VALUES
    (gen_random_uuid(), 'AAPL',  'Apple Inc.',            225.50, now(), now()),
    (gen_random_uuid(), 'MSFT',  'Microsoft Corp.',       430.20, now(), now()),
    (gen_random_uuid(), 'GOOGL', 'Alphabet Inc.',         168.75, now(), now()),
    (gen_random_uuid(), 'AMZN',  'Amazon.com Inc.',       185.40, now(), now()),
    (gen_random_uuid(), 'NVDA',  'NVIDIA Corp.',          128.30, now(), now()),
    (gen_random_uuid(), 'TSLA',  'Tesla Inc.',            248.60, now(), now()),
    (gen_random_uuid(), 'META',  'Meta Platforms Inc.',   565.90, now(), now()),
    (gen_random_uuid(), 'NFLX',  'Netflix Inc.',          705.10, now(), now());
