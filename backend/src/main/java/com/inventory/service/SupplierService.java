package com.inventory.service;

import com.inventory.entity.Supplier;
import com.inventory.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final com.inventory.repository.PurchaseOrderRepository purchaseOrderRepository;
    private final com.inventory.repository.PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Autowired
    public SupplierService(SupplierRepository supplierRepository,
                           com.inventory.repository.PurchaseOrderRepository purchaseOrderRepository,
                           com.inventory.repository.PurchaseOrderItemRepository purchaseOrderItemRepository) {
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
    }

    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public List<Supplier> getAllActiveSuppliers() {
        return supplierRepository.findByIsActiveTrue();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
    }

    public Supplier updateSupplier(Long id, Supplier updatedData) {
        Supplier existing = getSupplierById(id);
        existing.setName(updatedData.getName());
        existing.setContactPerson(updatedData.getContactPerson());
        existing.setPhone(updatedData.getPhone());
        existing.setEmail(updatedData.getEmail());
        existing.setAddress(updatedData.getAddress());
        return supplierRepository.save(existing);
    }

    public void deactivateSupplier(Long id) {
        Supplier existing = getSupplierById(id);
        existing.setIsActive(false);
        supplierRepository.save(existing);
    }

    public java.util.List<com.inventory.entity.PurchaseOrder> getPurchaseHistoryForSupplier(Long supplierId) {
        Supplier supplier = getSupplierById(supplierId);
        return purchaseOrderRepository.findBySupplierId(supplierId);
    }

    public java.util.List<SupplierReportEntry> getSupplierReport() {
        return supplierRepository.findAllActiveSorted().stream()
                .map(s -> {
                    java.util.List<com.inventory.entity.PurchaseOrder> orders =
                            purchaseOrderRepository.findBySupplierId(s.getId());
                    long orderCount = orders.size();
                    java.math.BigDecimal totalSpend = orders.stream()
                            .flatMap(o -> purchaseOrderItemRepository.findByPurchaseOrderId(o.getId()).stream())
                            .map(i -> i.getUnitPrice() != null ?
                                    i.getUnitPrice().multiply(java.math.BigDecimal.valueOf(i.getQuantityOrdered()))
                                    : java.math.BigDecimal.ZERO)
                            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                    return new SupplierReportEntry(s, orderCount, totalSpend);
                })
                .collect(java.util.stream.Collectors.toList());
    }

    public record SupplierReportEntry(com.inventory.entity.Supplier supplier, long orderCount, java.math.BigDecimal totalSpend) {}
}