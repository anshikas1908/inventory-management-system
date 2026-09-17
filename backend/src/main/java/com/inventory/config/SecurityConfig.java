package com.inventory.config;

import com.inventory.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    @Autowired
    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            UserDetailsService userDetailsService) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {

        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            // Authentication and authorization error handling
            .exceptionHandling(exception -> exception

                // Unauthenticated user -> 401 Unauthorized
                .authenticationEntryPoint((request, response, authException) -> {
                    response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED,
                        "Authentication required"
                    );
                })

                // Authenticated user without permission -> 403 Forbidden
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.sendError(
                        HttpServletResponse.SC_FORBIDDEN,
                        "Access denied"
                    );
                })
            )

            .authorizeHttpRequests(auth -> auth

                // Public authentication endpoints
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login"
                ).permitAll()

                // Admin-only endpoint
                .requestMatchers(
                    "/api/auth/register-privileged"
                ).hasRole("ADMIN")

                // Supplier portal
                .requestMatchers(
                    "/api/portal/supplier/**"
                ).hasAnyRole(
                    "SUPPLIER_CONTACT",
                    "ADMIN",
                    "MANAGER"
                )

                // Customer portal
                .requestMatchers(
                    "/api/portal/customer/**"
                ).hasAnyRole(
                    "CUSTOMER",
                    "ADMIN",
                    "MANAGER",
                    "STAFF"
                )

                // Everything else requires authentication
                .anyRequest().authenticated()
            )

            .authenticationProvider(authenticationProvider())

            // JWT authentication filter
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {

        org.springframework.web.cors.CorsConfiguration configuration =
            new org.springframework.web.cors.CorsConfiguration();

        configuration.setAllowedOrigins(
            java.util.List.of("http://localhost:5173")
        );

        configuration.setAllowedMethods(
            java.util.List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            )
        );

        configuration.setAllowedHeaders(
            java.util.List.of("*")
        );

        configuration.setAllowCredentials(true);

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source =
            new org.springframework.web.cors.UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            configuration
        );

        return source;
    }
}