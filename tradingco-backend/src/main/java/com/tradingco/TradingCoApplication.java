package com.tradingco;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class TradingCoApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradingCoApplication.class, args);
    }
}
