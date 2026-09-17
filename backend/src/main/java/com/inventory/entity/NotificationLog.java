package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;

    @Column(nullable = false, length = 20)
    private String type; // EMAIL, SMS, PUSH

    @Column(length = 150)
    private String recipient;

    @Column(length = 500)
    private String message;

    @Column(name = "current_quantity")
    private Integer currentQuantity;

    @Column(name = "threshold")
    private Integer threshold;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();
}
