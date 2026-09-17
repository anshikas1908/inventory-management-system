package com.inventory.repository;
import com.inventory.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByPurchaseOrderId(Long purchaseOrderId);
    List<Invoice> findByStatus(String status);
    boolean existsByInvoiceNumber(String invoiceNumber);
}
