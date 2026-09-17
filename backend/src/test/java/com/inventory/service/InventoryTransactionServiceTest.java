package com.inventory.service;

import com.inventory.entity.InventoryTransaction;
import com.inventory.entity.Product;
import com.inventory.entity.User;
import com.inventory.repository.InventoryTransactionRepository;
import com.inventory.repository.ProductRepository;
import com.inventory.repository.UserRepository;
import com.inventory.repository.WarehouseRepository;
import com.inventory.repository.WarehouseStockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryTransactionServiceTest {

    @Mock
    private InventoryTransactionRepository transactionRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private WarehouseStockRepository warehouseStockRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private InventoryTransactionService transactionService;

    private Product testProduct;
    private User testUser;
    private InventoryTransaction pendingTransaction;

    @BeforeEach
    void setUp() {
        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setCurrentQuantity(100);
        testProduct.setMinStockThreshold(10);

        testUser = new User();
        testUser.setId(1L);

        pendingTransaction = new InventoryTransaction();
        pendingTransaction.setId(1L);
        pendingTransaction.setProduct(testProduct);
        pendingTransaction.setQuantity(20);
        pendingTransaction.setType("ADJUSTMENT");
        pendingTransaction.setStatus("PENDING_APPROVAL");
    }

    @Test
    void recordStockIn_success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(warehouseRepository.findByIsDefaultTrue()).thenReturn(Optional.empty());
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(i -> i.getArgument(0));

        // Signature: recordStockIn(productId, quantity, userId, referencePurchaseOrderId)
        InventoryTransaction result = transactionService.recordStockIn(1L, 50, 1L, null);

        assertThat(result).isNotNull();
        assertThat(result.getType()).isEqualTo("STOCK_IN");
        assertThat(result.getQuantity()).isEqualTo(50);
        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(testProduct.getCurrentQuantity()).isEqualTo(150);
        verify(productRepository).save(testProduct);
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    void recordStockIn_negativeQuantity_throwsException() {
        assertThatThrownBy(() -> transactionService.recordStockIn(1L, -10, 1L, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void recordStockIn_productNotFound_throwsException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.recordStockIn(99L, 50, 1L, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void recordStockOut_success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(warehouseRepository.findByIsDefaultTrue()).thenReturn(Optional.empty());
        doNothing().when(notificationService).checkAndNotifyLowStock(any(Product.class), anyInt());
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(i -> i.getArgument(0));

        // Signature: recordStockOut(productId, quantity, userId)
        InventoryTransaction result = transactionService.recordStockOut(1L, 30, 1L);

        assertThat(result).isNotNull();
        assertThat(testProduct.getCurrentQuantity()).isEqualTo(70);
    }

    @Test
    void recordStockOut_insufficientStock_throwsException() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> transactionService.recordStockOut(1L, 150, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void requestAdjustment_success_pendingStatus() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(i -> i.getArgument(0));

        // Signature: requestAdjustment(productId, type, quantity, userId, reason)
        InventoryTransaction result = transactionService.requestAdjustment(1L, "ADJUSTMENT", 20, 1L, "Found extras");

        assertThat(result.getStatus()).isEqualTo("PENDING_APPROVAL");
        // Stock shouldn't be changed yet
        assertThat(testProduct.getCurrentQuantity()).isEqualTo(100);
    }

    @Test
    void requestAdjustment_missingReason_throwsException() {
        assertThatThrownBy(() -> transactionService.requestAdjustment(1L, "ADJUSTMENT", 20, 1L, ""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void requestAdjustment_invalidType_throwsException() {
        // STOCK_IN is not a valid adjustment type
        assertThatThrownBy(() -> transactionService.requestAdjustment(1L, "STOCK_IN", 20, 1L, "Reason"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void approveAdjustment_success() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(pendingTransaction));
        when(userRepository.findById(2L)).thenReturn(Optional.of(new User()));
        doNothing().when(notificationService).checkAndNotifyLowStock(any(Product.class), anyInt());
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(i -> i.getArgument(0));

        InventoryTransaction result = transactionService.approveAdjustment(1L, 2L);

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(testProduct.getCurrentQuantity()).isEqualTo(80); // 100 - 20
        verify(productRepository).save(testProduct);
    }

    @Test
    void approveAdjustment_notPending_throwsException() {
        pendingTransaction.setStatus("COMPLETED");
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(pendingTransaction));

        assertThatThrownBy(() -> transactionService.approveAdjustment(1L, 2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectAdjustment_success() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(pendingTransaction));
        when(userRepository.findById(2L)).thenReturn(Optional.of(new User()));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(i -> i.getArgument(0));

        // Signature: rejectAdjustment(transactionId, approverId) — no reason arg
        InventoryTransaction result = transactionService.rejectAdjustment(1L, 2L);

        assertThat(result.getStatus()).isEqualTo("REJECTED");
        assertThat(testProduct.getCurrentQuantity()).isEqualTo(100); // Unchanged
    }

    @Test
    void getPendingApprovals_delegatesToRepository() {
        when(transactionRepository.findByStatus("PENDING_APPROVAL")).thenReturn(List.of(pendingTransaction));

        List<InventoryTransaction> result = transactionService.getPendingApprovals();

        assertThat(result).hasSize(1);
    }
}
