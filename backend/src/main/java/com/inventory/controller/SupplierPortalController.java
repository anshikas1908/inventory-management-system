package com.inventory.controller;

import com.inventory.entity.*;
import com.inventory.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/portal/supplier")
@PreAuthorize("hasAnyRole('SUPPLIER_CONTACT', 'ADMIN', 'MANAGER')")
public class SupplierPortalController {

    private final UserRepository userRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InvoiceRepository invoiceRepository;

    @Autowired
    public SupplierPortalController(UserRepository userRepository,
                                     PurchaseOrderRepository purchaseOrderRepository,
                                     InvoiceRepository invoiceRepository) {
        this.userRepository = userRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.invoiceRepository = invoiceRepository;
    }

    private User getCurrentUser(Authentication auth) {
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @GetMapping("/purchase-orders")
    public ResponseEntity<List<PurchaseOrder>> getMyPurchaseOrders(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user.getLinkedSupplierId() == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(purchaseOrderRepository.findBySupplierId(user.getLinkedSupplierId()));
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<Invoice>> getMyInvoices(Authentication auth) {
        User user = getCurrentUser(auth);
        if (user.getLinkedSupplierId() == null) {
            return ResponseEntity.ok(List.of());
        }
        List<PurchaseOrder> orders = purchaseOrderRepository.findBySupplierId(user.getLinkedSupplierId());
        List<Invoice> invoices = orders.stream()
                .flatMap(o -> invoiceRepository.findByPurchaseOrderId(o.getId()).stream())
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(invoices);
    }
}
