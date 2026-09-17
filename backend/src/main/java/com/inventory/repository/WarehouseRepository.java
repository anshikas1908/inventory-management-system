package com.inventory.repository;
import com.inventory.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findByIsActiveTrue();
    Optional<Warehouse> findByIsDefaultTrue();
    Optional<Warehouse> findByCode(String code);
}
