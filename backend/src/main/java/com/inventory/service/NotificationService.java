package com.inventory.service;

import com.inventory.entity.NotificationLog;
import com.inventory.entity.Product;
import com.inventory.repository.NotificationLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationLogRepository notificationLogRepository;
    // JavaMailSender may be null if spring.mail.host is not configured
    private final JavaMailSender mailSender;

    @Value("${app.notifications.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.notifications.email.from:noreply@inventory.local}")
    private String fromEmail;

    @Value("${app.notifications.email.admin:admin@inventory.local}")
    private String adminEmail;

    @Autowired
    public NotificationService(NotificationLogRepository notificationLogRepository,
                               @Autowired(required = false) JavaMailSender mailSender) {
        this.notificationLogRepository = notificationLogRepository;
        this.mailSender = mailSender;
    }

    /**
     * Check if product is below threshold and send a notification if one hasn't been sent in the last 24 hours.
     */
    public void checkAndNotifyLowStock(Product product, int currentQty) {
        if (product.getMinStockThreshold() == null || currentQty >= product.getMinStockThreshold()) {
            return; // Not low stock
        }

        // Avoid spamming: only notify once per 24h per product
        LocalDateTime oneDayAgo = LocalDateTime.now().minusHours(24);
        boolean recentlySent = notificationLogRepository
                .existsByProductIdAndSentAtAfter(product.getId(), oneDayAgo);
        if (recentlySent) {
            return;
        }

        String message = String.format(
                "LOW STOCK ALERT: Product '%s' (SKU: %s) is below minimum threshold. " +
                "Current quantity: %d, Minimum threshold: %d",
                product.getName(), product.getSku(), currentQty, product.getMinStockThreshold());

        // Log to database
        NotificationLog logEntry = new NotificationLog();
        logEntry.setProduct(product);
        logEntry.setType("EMAIL");
        logEntry.setRecipient(adminEmail);
        logEntry.setMessage(message);
        logEntry.setCurrentQuantity(currentQty);
        logEntry.setThreshold(product.getMinStockThreshold());
        logEntry.setSentAt(LocalDateTime.now());
        notificationLogRepository.save(logEntry);

        // Send email if configured
        if (emailEnabled && mailSender != null) {
            try {
                SimpleMailMessage email = new SimpleMailMessage();
                email.setFrom(fromEmail);
                email.setTo(adminEmail);
                email.setSubject("Low Stock Alert: " + product.getName());
                email.setText(message);
                mailSender.send(email);
                log.info("Low-stock email sent for product: {}", product.getSku());
            } catch (Exception e) {
                log.error("Failed to send low-stock email for product {}: {}", product.getSku(), e.getMessage());
            }
        } else {
            log.warn("Low-stock notification logged but email not sent (disabled or not configured): {}", product.getSku());
        }
    }

    public java.util.List<NotificationLog> getAllNotifications() {
        return notificationLogRepository.findAllByOrderBySentAtDesc();
    }

    public java.util.List<NotificationLog> getNotificationsForProduct(Long productId) {
        return notificationLogRepository.findByProductIdOrderBySentAtDesc(productId);
    }
}
