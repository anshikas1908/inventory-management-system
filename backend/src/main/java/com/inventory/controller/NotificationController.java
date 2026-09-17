package com.inventory.controller;

import com.inventory.entity.NotificationLog;
import com.inventory.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @Autowired
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationLog>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<NotificationLog>> getNotificationsForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(notificationService.getNotificationsForProduct(productId));
    }
}
