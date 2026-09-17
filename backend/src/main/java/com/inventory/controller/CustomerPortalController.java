package com.inventory.controller;

import com.inventory.entity.Product;
import com.inventory.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/portal/customer")
@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF')")
public class CustomerPortalController {

    private final ProductService productService;

    @Autowired
    public CustomerPortalController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getProductCatalogue() {
        return ResponseEntity.ok(productService.getAllActiveProducts());
    }
}
