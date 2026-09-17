package com.inventory.service;

import com.inventory.entity.Invoice;
import com.inventory.entity.PurchaseOrder;
import com.inventory.repository.InvoiceRepository;
import com.inventory.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    public InvoiceService(InvoiceRepository invoiceRepository, PurchaseOrderRepository purchaseOrderRepository) {
        this.invoiceRepository = invoiceRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @Transactional
    public Invoice createInvoice(Long purchaseOrderId, Invoice invoice) {
        PurchaseOrder po = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
                
        if (invoiceRepository.existsByInvoiceNumber(invoice.getInvoiceNumber())) {
            throw new IllegalArgumentException("Invoice number already exists");
        }
        
        invoice.setPurchaseOrder(po);
        
        if (invoice.getPaidAmount() == null) {
            invoice.setPaidAmount(BigDecimal.ZERO);
        }
        
        if (invoice.getPaidAmount().compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus("PAID");
        } else if (invoice.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus("PARTIAL");
        } else {
            invoice.setStatus("UNPAID");
        }
        
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice recordPayment(Long invoiceId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
                
        BigDecimal newPaidAmount = invoice.getPaidAmount().add(amount);
        invoice.setPaidAmount(newPaidAmount);
        
        if (newPaidAmount.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus("PAID");
        } else {
            invoice.setStatus("PARTIAL");
        }
        
        return invoiceRepository.save(invoice);
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
    }

    public List<Invoice> getInvoicesByPurchaseOrder(Long poId) {
        return invoiceRepository.findByPurchaseOrderId(poId);
    }
}
