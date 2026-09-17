package com.inventory.controller;

import com.inventory.entity.*;
import com.inventory.repository.UserRepository;
import com.inventory.service.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final UserRepository userRepository;

    @Autowired
    public WarehouseController(WarehouseService warehouseService, UserRepository userRepository) {
        this.warehouseService = warehouseService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication auth) {
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping
    public ResponseEntity<Warehouse> createWarehouse(@RequestBody Warehouse warehouse) {
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseService.createWarehouse(warehouse));
    }

    @GetMapping
    public ResponseEntity<List<Warehouse>> getAllWarehouses() {
        return ResponseEntity.ok(warehouseService.getAllActiveWarehouses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Warehouse> getWarehouse(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getWarehouseById(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<Warehouse> updateWarehouse(@PathVariable Long id, @RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(warehouseService.updateWarehouse(id, warehouse));
    }

    @GetMapping("/{id}/stock")
    public ResponseEntity<List<WarehouseStock>> getWarehouseStock(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getStockForWarehouse(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping("/transfers")
    public ResponseEntity<WarehouseTransfer> initiateTransfer(
            @RequestBody TransferRequest request, Authentication auth) {
        User user = getCurrentUser(auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                warehouseService.initiateTransfer(
                        request.fromWarehouseId(), request.toWarehouseId(),
                        request.productId(), request.quantity(), request.notes(), user.getId()));
    }

    @GetMapping("/transfers")
    public ResponseEntity<List<WarehouseTransfer>> getAllTransfers() {
        return ResponseEntity.ok(warehouseService.getAllTransfers());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PatchMapping("/transfers/{id}/complete")
    public ResponseEntity<WarehouseTransfer> completeTransfer(
            @PathVariable Long id, Authentication auth) {
        User user = getCurrentUser(auth);
        return ResponseEntity.ok(warehouseService.completeTransfer(id, user.getId()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PatchMapping("/transfers/{id}/cancel")
    public ResponseEntity<WarehouseTransfer> cancelTransfer(
            @PathVariable Long id, Authentication auth) {
        User user = getCurrentUser(auth);
        return ResponseEntity.ok(warehouseService.cancelTransfer(id, user.getId()));
    }

    public record TransferRequest(Long fromWarehouseId, Long toWarehouseId,
                                  Long productId, Integer quantity, String notes) {}
}
