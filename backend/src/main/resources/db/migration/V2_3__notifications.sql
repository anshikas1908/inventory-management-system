CREATE TABLE IF NOT EXISTS notification_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    recipient VARCHAR(150),
    message VARCHAR(500),
    current_quantity INT,
    threshold INT,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id)
);
