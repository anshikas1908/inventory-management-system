package com.inventory.controller;

import com.inventory.entity.Invoice;
import com.inventory.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @Autowired
    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @GetMapping("/po/{poId}")
    public ResponseEntity<List<Invoice>> getInvoicesByPurchaseOrder(@PathVariable Long poId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByPurchaseOrder(poId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@RequestBody InvoiceRequest request) {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(request.invoiceNumber());
        invoice.setInvoiceDate(request.invoiceDate());
        invoice.setDueDate(request.dueDate());
        invoice.setTotalAmount(request.totalAmount());
        invoice.setNotes(request.notes());
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.createInvoice(request.purchaseOrderId(), invoice));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PatchMapping("/{id}/payment")
    public ResponseEntity<Invoice> recordPayment(@PathVariable Long id, @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(invoiceService.recordPayment(id, request.amount()));
    }

    public record InvoiceRequest(Long purchaseOrderId, String invoiceNumber, LocalDate invoiceDate, LocalDate dueDate, BigDecimal totalAmount, String notes) {}
    public record PaymentRequest(BigDecimal amount) {}
}
