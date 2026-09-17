package com.inventory.repository;
import com.inventory.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    List<NotificationLog> findByProductIdOrderBySentAtDesc(Long productId);
    List<NotificationLog> findAllByOrderBySentAtDesc();
    boolean existsByProductIdAndSentAtAfter(Long productId, LocalDateTime after);
}
