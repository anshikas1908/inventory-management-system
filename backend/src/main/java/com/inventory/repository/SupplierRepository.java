package com.inventory.repository;

import com.inventory.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findByIsActiveTrue();

    @Query("SELECT s FROM Supplier s WHERE s.isActive = true ORDER BY s.name")
    List<Supplier> findAllActiveSorted();
}