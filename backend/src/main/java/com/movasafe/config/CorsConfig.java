package com.movasafe.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global CORS Configuration for MovaSafe Admin Portal
 * 
 * This configuration allows cross-origin requests from the frontend
 * running on localhost:3000 and 192.168.206.1:3000
 * 
 * Security Notes:
 * - Uses specific allowed origins (not wildcard *) to maintain security
 * - Allows credentials for authenticated requests
 * - Applies to all endpoints (/**)
 * - Handles preflight OPTIONS requests automatically
 */
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins(
                        "http://localhost:3000",
                        "http://192.168.206.1:3000"
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600); // Cache preflight response for 1 hour
            }
        };
    }
}
