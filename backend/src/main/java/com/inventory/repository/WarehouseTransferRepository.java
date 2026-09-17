package com.inventory.repository;
import com.inventory.entity.WarehouseTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WarehouseTransferRepository extends JpaRepository<WarehouseTransfer, Long> {
    List<WarehouseTransfer> findByFromWarehouseIdOrToWarehouseId(Long fromId, Long toId);
    List<WarehouseTransfer> findByStatus(String status);
    List<WarehouseTransfer> findByProductId(Long productId);
}
