-- PO workflow enhancements
ALTER TABLE purchase_order
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS approved_by BIGINT,
    ADD COLUMN IF NOT EXISTS approved_at DATETIME,
    ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500),
    ADD COLUMN IF NOT EXISTS notes VARCHAR(500);

ALTER TABLE purchase_order
    ADD CONSTRAINT IF NOT EXISTS fk_po_approved_by FOREIGN KEY (approved_by) REFERENCES `user`(id);

ALTER TABLE purchase_order_item
    ADD COLUMN IF NOT EXISTS quantity_received INT NOT NULL DEFAULT 0;
