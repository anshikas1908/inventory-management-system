package com.inventory.service;

import com.inventory.entity.*;
import com.inventory.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    public PurchaseOrderService(
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseOrderItemRepository purchaseOrderItemRepository,
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            InventoryTransactionRepository inventoryTransactionRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
    }

    public PurchaseOrder createPurchaseOrder(Long supplierId, Long createdByUserId, List<LineItemRequest> items) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        User createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Purchase order must have at least one item");
        }

        PurchaseOrder order = new PurchaseOrder();
        order.setSupplier(supplier);
        order.setCreatedBy(createdBy);
        order.setStatus("DRAFT");
        PurchaseOrder savedOrder = purchaseOrderRepository.save(order);

        for (LineItemRequest item : items) {
            Product product = productRepository.findById(item.productId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + item.productId()));

            PurchaseOrderItem poItem = new PurchaseOrderItem();
            poItem.setPurchaseOrder(savedOrder);
            poItem.setProduct(product);
            poItem.setQuantityOrdered(item.quantity());
            poItem.setUnitPrice(item.unitPrice());
            purchaseOrderItemRepository.save(poItem);
        }

        return savedOrder;
    }

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    public PurchaseOrder getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
    }

    public List<PurchaseOrderItem> getItemsForOrder(Long purchaseOrderId) {
        return purchaseOrderItemRepository.findByPurchaseOrderId(purchaseOrderId);
    }
    
    public List<PurchaseOrder> getOrdersBySupplier(Long supplierId) {
        return purchaseOrderRepository.findBySupplierId(supplierId);
    }
    
    public List<PurchaseOrder> getOrdersByStatus(String status) {
        return purchaseOrderRepository.findByStatus(status);
    }
    
    public PurchaseOrder submitForApproval(Long poId) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
        if (!"DRAFT".equals(po.getStatus())) {
            throw new IllegalArgumentException("Only DRAFT orders can be submitted for approval");
        }
        po.setStatus("PENDING_APPROVAL");
        return purchaseOrderRepository.save(po);
    }

    public PurchaseOrder approvePurchaseOrder(Long poId, Long approverId) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
        if (!"PENDING_APPROVAL".equals(po.getStatus())) {
            throw new IllegalArgumentException("Only PENDING_APPROVAL orders can be approved");
        }
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found"));
        po.setStatus("APPROVED");
        po.setApprovedBy(approver);
        po.setApprovedAt(java.time.LocalDateTime.now());
        return purchaseOrderRepository.save(po);
    }

    public PurchaseOrder rejectPurchaseOrder(Long poId, Long approverId, String reason) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
        if (!"PENDING_APPROVAL".equals(po.getStatus())) {
            throw new IllegalArgumentException("Only PENDING_APPROVAL orders can be rejected");
        }
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found"));
        po.setStatus("CANCELLED");
        po.setApprovedBy(approver);
        po.setRejectionReason(reason);
        return purchaseOrderRepository.save(po);
    }

    @org.springframework.transaction.annotation.Transactional
    public PurchaseOrder receiveItems(Long poId, java.util.List<ReceiveItemRequest> receives, Long userId) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
        if (!"APPROVED".equals(po.getStatus()) && !"PARTIALLY_RECEIVED".equals(po.getStatus())) {
            throw new IllegalArgumentException("Only APPROVED or PARTIALLY_RECEIVED orders can receive items");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        for (ReceiveItemRequest receive : receives) {
            PurchaseOrderItem item = purchaseOrderItemRepository.findById(receive.purchaseOrderItemId())
                    .orElseThrow(() -> new IllegalArgumentException("PO Item not found: " + receive.purchaseOrderItemId()));
            if (!item.getPurchaseOrder().getId().equals(poId)) {
                throw new IllegalArgumentException("Item does not belong to this PO");
            }
            int remaining = item.getQuantityOrdered() - item.getQuantityReceived();
            if (receive.quantityReceived() > remaining) {
                throw new IllegalArgumentException("Cannot receive more than ordered for item: " + item.getProduct().getName());
            }
            item.setQuantityReceived(item.getQuantityReceived() + receive.quantityReceived());
            purchaseOrderItemRepository.save(item);

            // Create STOCK_IN transaction
            Product product = item.getProduct();
            int before = product.getCurrentQuantity();
            int after = before + receive.quantityReceived();
            product.setCurrentQuantity(after);
            productRepository.save(product);

            com.inventory.entity.InventoryTransaction txn = new com.inventory.entity.InventoryTransaction();
            txn.setProduct(product);
            txn.setType("STOCK_IN");
            txn.setQuantity(receive.quantityReceived());
            txn.setQuantityBefore(before);
            txn.setQuantityAfter(after);
            txn.setStatus("COMPLETED");
            txn.setPerformedBy(user);
            txn.setReferencePurchaseOrder(po);
            inventoryTransactionRepository.save(txn);
        }

        // Determine PO status
        java.util.List<PurchaseOrderItem> allItems = purchaseOrderItemRepository.findByPurchaseOrderId(poId);
        boolean allFullyReceived = allItems.stream()
                .allMatch(i -> i.getQuantityReceived().equals(i.getQuantityOrdered()));
        po.setStatus(allFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED");
        if (allFullyReceived) {
            po.setReceivedDate(java.time.LocalDateTime.now());
        }
        return purchaseOrderRepository.save(po);
    }

    public record LineItemRequest(Long productId, Integer quantity, java.math.BigDecimal unitPrice) {}
    public record ReceiveItemRequest(Long purchaseOrderItemId, Integer quantityReceived) {}
}