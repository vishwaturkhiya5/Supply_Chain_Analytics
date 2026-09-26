DROP TABLE IF EXISTS supply_chain;

CREATE TABLE supply_chain (
    transaction_type TEXT,
    actual_shipping_days INTEGER,
    scheduled_shipping_days INTEGER,
    delivery_status TEXT,
    late_delivery_risk INTEGER CHECK (late_delivery_risk IN (0, 1)),
    category_id INTEGER,
    category_name TEXT,
    customer_city TEXT,
    customer_country TEXT,
    customer_id INTEGER,
    customer_segment TEXT,
    customer_state TEXT,
    department_id INTEGER,
    department_name TEXT,
    market TEXT,
    order_city TEXT,
    order_country TEXT,
    order_date TEXT,
    order_id INTEGER,
    discount_amount REAL,
    discount_rate REAL,
    order_item_id INTEGER PRIMARY KEY,
    unit_price REAL,
    profit_ratio REAL,
    quantity INTEGER,
    gross_sales REAL,
    net_sales REAL,
    profit REAL,
    order_region TEXT,
    order_state TEXT,
    order_status TEXT,
    product_id INTEGER,
    product_name TEXT,
    product_price REAL,
    product_status INTEGER,
    shipping_date TEXT,
    shipping_mode TEXT,
    shipping_variance_days INTEGER,
    is_late INTEGER CHECK (is_late IN (0, 1)),
    order_year INTEGER,
    order_month INTEGER,
    order_year_month TEXT
);

CREATE INDEX idx_supply_chain_order_id ON supply_chain(order_id);
CREATE INDEX idx_supply_chain_order_date ON supply_chain(order_date);
CREATE INDEX idx_supply_chain_market ON supply_chain(market);
CREATE INDEX idx_supply_chain_region ON supply_chain(order_region);
CREATE INDEX idx_supply_chain_product ON supply_chain(product_id);
CREATE INDEX idx_supply_chain_category ON supply_chain(category_id);

