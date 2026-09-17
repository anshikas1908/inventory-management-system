package com.inventory.repository;
import com.inventory.entity.WarehouseStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, Long> {
    List<WarehouseStock> findByWarehouseId(Long warehouseId);
    List<WarehouseStock> findByProductId(Long productId);
    Optional<WarehouseStock> findByWarehouseIdAndProductId(Long warehouseId, Long productId);
    
    @Query("SELECT COALESCE(SUM(ws.currentQuantity), 0) FROM WarehouseStock ws WHERE ws.product.id = :productId")
    Integer sumQuantityByProductId(Long productId);
}
