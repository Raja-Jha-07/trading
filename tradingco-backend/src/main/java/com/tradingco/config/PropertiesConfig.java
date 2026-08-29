package com.tradingco.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({
        AppProperties.Jwt.class,
        AppProperties.Cors.class,
        AppProperties.Market.class
})
public class PropertiesConfig {
}
