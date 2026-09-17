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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final WarehouseTransferRepository warehouseTransferRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Autowired
    public WarehouseService(WarehouseRepository warehouseRepository,
                            WarehouseStockRepository warehouseStockRepository,
                            WarehouseTransferRepository warehouseTransferRepository,
                            ProductRepository productRepository,
                            UserRepository userRepository) {
        this.warehouseRepository = warehouseRepository;
        this.warehouseStockRepository = warehouseStockRepository;
        this.warehouseTransferRepository = warehouseTransferRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Warehouse createWarehouse(Warehouse warehouse) {
        if (warehouseRepository.count() == 0) {
            warehouse.setIsDefault(true);
        }
        if (Boolean.TRUE.equals(warehouse.getIsDefault())) {
            warehouseRepository.findByIsDefaultTrue().ifPresent(w -> {
                w.setIsDefault(false);
                warehouseRepository.save(w);
            });
        }
        return warehouseRepository.save(warehouse);
    }

    public List<Warehouse> getAllActiveWarehouses() {
        return warehouseRepository.findByIsActiveTrue();
    }

    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Warehouse not found"));
    }

    @Transactional
    public Warehouse updateWarehouse(Long id, Warehouse data) {
        Warehouse existing = getWarehouseById(id);
        existing.setCode(data.getCode());
        existing.setName(data.getName());
        existing.setLocation(data.getLocation());
        
        if (Boolean.TRUE.equals(data.getIsDefault()) && !Boolean.TRUE.equals(existing.getIsDefault())) {
            warehouseRepository.findByIsDefaultTrue().ifPresent(w -> {
                w.setIsDefault(false);
                warehouseRepository.save(w);
            });
            existing.setIsDefault(true);
        }
        return warehouseRepository.save(existing);
    }

    @Transactional
    public void deactivateWarehouse(Long id) {
        Warehouse existing = getWarehouseById(id);
        if (Boolean.TRUE.equals(existing.getIsDefault())) {
            throw new IllegalArgumentException("Cannot deactivate the default warehouse");
        }
        existing.setIsActive(false);
        warehouseRepository.save(existing);
    }

    @Transactional
    public Warehouse getOrCreateDefaultWarehouse() {
        return warehouseRepository.findByIsDefaultTrue()
                .orElseGet(() -> {
                    Warehouse w = new Warehouse();
                    w.setCode("MAIN");
                    w.setName("Main Warehouse");
                    w.setIsDefault(true);
                    return warehouseRepository.save(w);
                });
    }

    public List<WarehouseStock> getStockForWarehouse(Long warehouseId) {
        return warehouseStockRepository.findByWarehouseId(warehouseId);
    }

    public List<WarehouseTransfer> getAllTransfers() {
        return warehouseTransferRepository.findAll();
    }

    @Transactional
    public WarehouseTransfer initiateTransfer(Long fromWarehouseId, Long toWarehouseId, Long productId, Integer quantity, String notes, Long userId) {
        if (fromWarehouseId.equals(toWarehouseId)) {
            throw new IllegalArgumentException("Source and destination warehouses must be different");
        }
        
        Warehouse fromWarehouse = getWarehouseById(fromWarehouseId);
        Warehouse toWarehouse = getWarehouseById(toWarehouseId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        WarehouseStock fromStock = warehouseStockRepository.findByWarehouseIdAndProductId(fromWarehouseId, productId)
                .orElseThrow(() -> new IllegalArgumentException("No stock found in source warehouse"));
                
        if (fromStock.getCurrentQuantity() < quantity) {
            throw new IllegalArgumentException("Insufficient stock in source warehouse");
        }
        
        WarehouseTransfer transfer = new WarehouseTransfer();
        transfer.setFromWarehouse(fromWarehouse);
        transfer.setToWarehouse(toWarehouse);
        transfer.setProduct(product);
        transfer.setQuantity(quantity);
        transfer.setNotes(notes);
        transfer.setInitiatedBy(user);
        transfer.setStatus("PENDING");
        
        return warehouseTransferRepository.save(transfer);
    }

    @Transactional
    public WarehouseTransfer completeTransfer(Long transferId, Long userId) {
        WarehouseTransfer transfer = warehouseTransferRepository.findById(transferId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer not found"));
                
        if (!"PENDING".equals(transfer.getStatus())) {
            throw new IllegalArgumentException("Only pending transfers can be completed");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        WarehouseStock fromStock = warehouseStockRepository.findByWarehouseIdAndProductId(
                transfer.getFromWarehouse().getId(), transfer.getProduct().getId())
                .orElseThrow(() -> new IllegalArgumentException("Source stock not found"));
                
        if (fromStock.getCurrentQuantity() < transfer.getQuantity()) {
            throw new IllegalArgumentException("Insufficient stock in source warehouse to complete transfer");
        }
        
        WarehouseStock toStock = warehouseStockRepository.findByWarehouseIdAndProductId(
                transfer.getToWarehouse().getId(), transfer.getProduct().getId())
                .orElse(new WarehouseStock(null, transfer.getToWarehouse(), transfer.getProduct(), 0, null));
                
        fromStock.setCurrentQuantity(fromStock.getCurrentQuantity() - transfer.getQuantity());
        toStock.setCurrentQuantity(toStock.getCurrentQuantity() + transfer.getQuantity());
        
        warehouseStockRepository.save(fromStock);
        warehouseStockRepository.save(toStock);
        
        transfer.setStatus("COMPLETED");
        transfer.setCompletedBy(user);
        transfer.setCompletedAt(LocalDateTime.now());
        
        return warehouseTransferRepository.save(transfer);
    }

    @Transactional
    public WarehouseTransfer cancelTransfer(Long transferId, Long userId) {
        WarehouseTransfer transfer = warehouseTransferRepository.findById(transferId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer not found"));
                
        if (!"PENDING".equals(transfer.getStatus())) {
            throw new IllegalArgumentException("Only pending transfers can be cancelled");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        transfer.setStatus("CANCELLED");
        transfer.setCompletedBy(user);
        transfer.setCompletedAt(LocalDateTime.now());
        
        return warehouseTransferRepository.save(transfer);
    }
}
