package com.inventory.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class ProductControllerIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("ims_test")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private TestRestTemplate restTemplate;

    private String getAuthToken() {
        // Register an admin user first
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Register via register-privileged won't work without auth, so register as STAFF first
        Map<String, String> registerBody = Map.of(
                "fullName", "Test Admin",
                "email", "admin-test@test.com",
                "password", "password123"
        );
        restTemplate.postForEntity("/api/auth/register", new HttpEntity<>(registerBody, headers), Map.class);

        // Login
        Map<String, String> loginBody = Map.of(
                "email", "admin-test@test.com",
                "password", "password123"
        );
        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(
                "/api/auth/login", new HttpEntity<>(loginBody, headers), Map.class);

        return (String) loginResponse.getBody().get("token");
    }

    @Test
    void getProducts_authenticated_returns200() {
        String token = getAuthToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<Object[]> response = restTemplate.exchange(
                "/api/products", HttpMethod.GET, new HttpEntity<>(headers), Object[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void getProducts_unauthenticated_returns401() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/products", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void getProductByBarcode_notFound_returns400OrEmpty() {
        String token = getAuthToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/products/by-barcode?code=NONEXISTENT",
                HttpMethod.GET, new HttpEntity<>(headers), String.class);

        // Should return 400 bad request (product not found) or 500
        assertThat(response.getStatusCode().is4xxClientError() || response.getStatusCode().is5xxServerError()).isTrue();
    }

    @Test
    void getLowStockProducts_returns200() {
        String token = getAuthToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<Object[]> response = restTemplate.exchange(
                "/api/products/low-stock", HttpMethod.GET, new HttpEntity<>(headers), Object[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
