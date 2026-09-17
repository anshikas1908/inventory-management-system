-- Warehouse tables for V2
CREATE TABLE IF NOT EXISTS warehouse (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
);

INSERT INTO warehouse (code, name, location, is_active, is_default, created_at, updated_at)
VALUES ('MAIN', 'Main Warehouse', 'Default Location', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE is_default = 1;

CREATE TABLE IF NOT EXISTS warehouse_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    current_quantity INT NOT NULL DEFAULT 0,
    updated_at DATETIME,
    UNIQUE KEY uq_wh_product (warehouse_id, product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);

-- Migrate existing product.current_quantity to warehouse_stock for Main Warehouse
INSERT INTO warehouse_stock (warehouse_id, product_id, current_quantity, updated_at)
SELECT w.id, p.id, p.current_quantity, NOW()
FROM product p
CROSS JOIN warehouse w WHERE w.is_default = 1
ON DUPLICATE KEY UPDATE current_quantity = p.current_quantity;

CREATE TABLE IF NOT EXISTS warehouse_transfer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_warehouse_id BIGINT NOT NULL,
    to_warehouse_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes VARCHAR(255),
    initiated_by BIGINT NOT NULL,
    completed_by BIGINT,
    created_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (initiated_by) REFERENCES `user`(id),
    FOREIGN KEY (completed_by) REFERENCES `user`(id)
);
