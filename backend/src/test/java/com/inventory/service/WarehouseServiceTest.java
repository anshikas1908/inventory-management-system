package com.inventory.service;

import com.inventory.entity.Product;
import com.inventory.entity.User;
import com.inventory.entity.Warehouse;
import com.inventory.entity.WarehouseStock;
import com.inventory.entity.WarehouseTransfer;
import com.inventory.repository.ProductRepository;
import com.inventory.repository.UserRepository;
import com.inventory.repository.WarehouseRepository;
import com.inventory.repository.WarehouseStockRepository;
import com.inventory.repository.WarehouseTransferRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WarehouseServiceTest {

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private WarehouseStockRepository warehouseStockRepository;

    @Mock
    private WarehouseTransferRepository warehouseTransferRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WarehouseService warehouseService;

    private Warehouse warehouse;

    @BeforeEach
    void setUp() {
        warehouse = new Warehouse();
        warehouse.setId(1L);
        warehouse.setName("Main");
        warehouse.setIsActive(true);
        warehouse.setIsDefault(false);
    }

    @Test
    void createWarehouse_firstWarehouse_setsAsDefault() {
        when(warehouseRepository.count()).thenReturn(0L);
        when(warehouseRepository.save(any(Warehouse.class))).thenAnswer(i -> i.getArgument(0));

        Warehouse result = warehouseService.createWarehouse(warehouse);

        assertThat(result.getIsDefault()).isTrue();
    }

    @Test
    void createWarehouse_subsequentWarehouse_doesNotOverrideDefault() {
        when(warehouseRepository.count()).thenReturn(1L);
        when(warehouseRepository.save(any(Warehouse.class))).thenAnswer(i -> i.getArgument(0));

        Warehouse result = warehouseService.createWarehouse(warehouse);

        assertThat(result.getIsDefault()).isFalse();
    }

    @Test
    void getOrCreateDefaultWarehouse_existingDefault() {
        warehouse.setIsDefault(true);
        when(warehouseRepository.findByIsDefaultTrue()).thenReturn(Optional.of(warehouse));

        Warehouse result = warehouseService.getOrCreateDefaultWarehouse();

        assertThat(result.getId()).isEqualTo(1L);
        verify(warehouseRepository, never()).save(any());
    }

    @Test
    void getOrCreateDefaultWarehouse_noDefault_createsMainWarehouse() {
        when(warehouseRepository.findByIsDefaultTrue()).thenReturn(Optional.empty());
        when(warehouseRepository.save(any(Warehouse.class))).thenAnswer(i -> {
            Warehouse w = i.getArgument(0);
            w.setId(2L);
            return w;
        });

        Warehouse result = warehouseService.getOrCreateDefaultWarehouse();

        assertThat(result.getName()).isEqualTo("Main Warehouse");
        assertThat(result.getIsDefault()).isTrue();
        verify(warehouseRepository).save(any(Warehouse.class));
    }

    @Test
    void deactivateWarehouse_defaultWarehouse_throwsException() {
        warehouse.setIsDefault(true);
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));

        assertThatThrownBy(() -> warehouseService.deactivateWarehouse(1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deactivateWarehouse_nonDefault_succeeds() {
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(warehouseRepository.save(any(Warehouse.class))).thenAnswer(i -> i.getArgument(0));

        warehouseService.deactivateWarehouse(1L);

        assertThat(warehouse.getIsActive()).isFalse();
    }

    @Test
    void initiateTransfer_sameWarehouse_throwsException() {
        // fromId == toId should throw
        assertThatThrownBy(() -> warehouseService.initiateTransfer(1L, 1L, 1L, 10, "notes", 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void initiateTransfer_insufficientStock_throwsException() {
        Warehouse w1 = new Warehouse(); w1.setId(1L);
        Warehouse w2 = new Warehouse(); w2.setId(2L);

        WarehouseStock stock = new WarehouseStock();
        stock.setCurrentQuantity(5); // Less than requested 10

        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(w1));
        when(warehouseRepository.findById(2L)).thenReturn(Optional.of(w2));
        when(productRepository.findById(1L)).thenReturn(Optional.of(new Product()));
        when(userRepository.findById(1L)).thenReturn(Optional.of(new User()));
        when(warehouseStockRepository.findByWarehouseIdAndProductId(1L, 1L)).thenReturn(Optional.of(stock));

        assertThatThrownBy(() -> warehouseService.initiateTransfer(1L, 2L, 1L, 10, "notes", 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void initiateTransfer_success() {
        Warehouse w1 = new Warehouse(); w1.setId(1L);
        Warehouse w2 = new Warehouse(); w2.setId(2L);
        Product p = new Product(); p.setId(1L);
        User u = new User(); u.setId(1L);

        WarehouseStock stock = new WarehouseStock();
        stock.setCurrentQuantity(15);

        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(w1));
        when(warehouseRepository.findById(2L)).thenReturn(Optional.of(w2));
        when(productRepository.findById(1L)).thenReturn(Optional.of(p));
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(warehouseStockRepository.findByWarehouseIdAndProductId(1L, 1L)).thenReturn(Optional.of(stock));
        when(warehouseTransferRepository.save(any(WarehouseTransfer.class))).thenAnswer(i -> i.getArgument(0));

        WarehouseTransfer result = warehouseService.initiateTransfer(1L, 2L, 1L, 10, "notes", 1L);

        assertThat(result.getStatus()).isEqualTo("PENDING");
        assertThat(result.getQuantity()).isEqualTo(10);
    }

    @Test
    void completeTransfer_notPending_throwsException() {
        WarehouseTransfer transfer = new WarehouseTransfer();
        transfer.setStatus("COMPLETED");

        when(warehouseTransferRepository.findById(1L)).thenReturn(Optional.of(transfer));

        assertThatThrownBy(() -> warehouseService.completeTransfer(1L, 2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void completeTransfer_success() {
        Warehouse w1 = new Warehouse(); w1.setId(1L);
        Warehouse w2 = new Warehouse(); w2.setId(2L);
        Product p = new Product(); p.setId(1L);
        User u = new User(); u.setId(2L);

        WarehouseTransfer transfer = new WarehouseTransfer();
        transfer.setId(1L);
        transfer.setFromWarehouse(w1);
        transfer.setToWarehouse(w2);
        transfer.setProduct(p);
        transfer.setQuantity(10);
        transfer.setStatus("PENDING");

        WarehouseStock sourceStock = new WarehouseStock();
        sourceStock.setWarehouse(w1);
        sourceStock.setProduct(p);
        sourceStock.setCurrentQuantity(15);

        when(warehouseTransferRepository.findById(1L)).thenReturn(Optional.of(transfer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(u));
        when(warehouseStockRepository.findByWarehouseIdAndProductId(1L, 1L)).thenReturn(Optional.of(sourceStock));
        when(warehouseStockRepository.findByWarehouseIdAndProductId(2L, 1L)).thenReturn(Optional.empty());
        when(warehouseTransferRepository.save(any(WarehouseTransfer.class))).thenAnswer(i -> i.getArgument(0));

        WarehouseTransfer result = warehouseService.completeTransfer(1L, 2L);

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(sourceStock.getCurrentQuantity()).isEqualTo(5); // 15 - 10
        verify(warehouseStockRepository, times(2)).save(any(WarehouseStock.class));
    }

    @Test
    void cancelTransfer_success() {
        WarehouseTransfer transfer = new WarehouseTransfer();
        transfer.setId(1L);
        transfer.setStatus("PENDING");

        when(warehouseTransferRepository.findById(1L)).thenReturn(Optional.of(transfer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(new User()));
        when(warehouseTransferRepository.save(any(WarehouseTransfer.class))).thenAnswer(i -> i.getArgument(0));

        WarehouseTransfer result = warehouseService.cancelTransfer(1L, 2L);

        assertThat(result.getStatus()).isEqualTo("CANCELLED");
    }
}
