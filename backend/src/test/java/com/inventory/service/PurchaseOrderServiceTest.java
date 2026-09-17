package com.inventory.service;

import com.inventory.entity.*;
import com.inventory.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseOrderServiceTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @InjectMocks
    private PurchaseOrderService purchaseOrderService;

    private Supplier testSupplier;
    private User testUser;
    private PurchaseOrder draftOrder;
    private List<PurchaseOrderService.LineItemRequest> lineItems;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testSupplier = new Supplier();
        testSupplier.setId(1L);

        testUser = new User();
        testUser.setId(1L);

        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setCurrentQuantity(100);

        lineItems = new ArrayList<>();
        lineItems.add(new PurchaseOrderService.LineItemRequest(1L, 10, new BigDecimal("10.00")));

        draftOrder = new PurchaseOrder();
        draftOrder.setId(1L);
        draftOrder.setStatus("DRAFT");
        draftOrder.setSupplier(testSupplier);
        draftOrder.setCreatedBy(testUser);
    }

    @Test
    void createPurchaseOrder_success() {
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(testSupplier));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrder result = purchaseOrderService.createPurchaseOrder(1L, 1L, lineItems);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("DRAFT");
        verify(purchaseOrderRepository).save(any(PurchaseOrder.class));
    }

    @Test
    void createPurchaseOrder_emptyItems_throwsException() {
        assertThatThrownBy(() -> purchaseOrderService.createPurchaseOrder(1L, 1L, new ArrayList<>()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createPurchaseOrder_supplierNotFound_throwsException() {
        when(supplierRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> purchaseOrderService.createPurchaseOrder(99L, 1L, lineItems))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void submitForApproval_success() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(draftOrder));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrder result = purchaseOrderService.submitForApproval(1L);

        assertThat(result.getStatus()).isEqualTo("PENDING_APPROVAL");
    }

    @Test
    void submitForApproval_notDraft_throwsException() {
        draftOrder.setStatus("APPROVED");
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(draftOrder));

        assertThatThrownBy(() -> purchaseOrderService.submitForApproval(1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void approvePurchaseOrder_success() {
        draftOrder.setStatus("PENDING_APPROVAL");
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(draftOrder));
        when(userRepository.findById(2L)).thenReturn(Optional.of(new User()));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrder result = purchaseOrderService.approvePurchaseOrder(1L, 2L);

        assertThat(result.getStatus()).isEqualTo("APPROVED");
        assertThat(result.getApprovedBy()).isNotNull();
    }

    @Test
    void approvePurchaseOrder_notPending_throwsException() {
        // draftOrder is in DRAFT status — cannot approve
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(draftOrder));

        assertThatThrownBy(() -> purchaseOrderService.approvePurchaseOrder(1L, 2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectPurchaseOrder_success() {
        draftOrder.setStatus("PENDING_APPROVAL");
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(draftOrder));
        when(userRepository.findById(2L)).thenReturn(Optional.of(new User()));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrder result = purchaseOrderService.rejectPurchaseOrder(1L, 2L, "Too expensive");

        assertThat(result.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void getOrdersBySupplier_delegatesToRepository() {
        when(purchaseOrderRepository.findBySupplierId(1L)).thenReturn(List.of(draftOrder));
        List<PurchaseOrder> result = purchaseOrderService.getOrdersBySupplier(1L);
        assertThat(result).hasSize(1);
    }

    @Test
    void getOrdersByStatus_delegatesToRepository() {
        when(purchaseOrderRepository.findByStatus("DRAFT")).thenReturn(List.of(draftOrder));
        List<PurchaseOrder> result = purchaseOrderService.getOrdersByStatus("DRAFT");
        assertThat(result).hasSize(1);
    }
}
