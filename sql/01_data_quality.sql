-- Data quality and grain validation.

-- Source shape and candidate keys.
SELECT
    COUNT(*) AS total_records,
    COUNT(DISTINCT order_item_id) AS distinct_order_items,
    COUNT(DISTINCT order_id) AS distinct_orders,
    COUNT(DISTINCT customer_id) AS distinct_customers,
    COUNT(DISTINCT product_id) AS distinct_products
FROM supply_chain;

-- Duplicate candidate primary keys; expected result is no rows.
SELECT order_item_id, COUNT(*) AS duplicate_count
FROM supply_chain
GROUP BY order_item_id
HAVING COUNT(*) > 1;

-- Required-field completeness.
SELECT
    SUM(order_item_id IS NULL) AS missing_order_item_id,
    SUM(order_id IS NULL) AS missing_order_id,
    SUM(order_date IS NULL OR TRIM(order_date) = '') AS missing_order_date,
    SUM(gross_sales IS NULL) AS missing_gross_sales,
    SUM(profit IS NULL) AS missing_profit,
    SUM(delivery_status IS NULL OR TRIM(delivery_status) = '') AS missing_delivery_status,
    SUM(shipping_mode IS NULL OR TRIM(shipping_mode) = '') AS missing_shipping_mode
FROM supply_chain;

-- Domain and cross-field validation.
SELECT
    SUM(quantity < 0) AS negative_quantity_rows,
    SUM(gross_sales < 0) AS negative_gross_sales_rows,
    SUM(discount_rate < 0 OR discount_rate > 1) AS invalid_discount_rate_rows,
    SUM(late_delivery_risk NOT IN (0, 1)) AS invalid_late_flag_rows,
    SUM((late_delivery_risk = 1) <> (delivery_status = 'Late delivery')) AS late_status_mismatches,
    SUM(shipping_date < order_date) AS shipping_before_order_rows
FROM supply_chain;

-- Monetary reconciliation. Tiny differences can reflect cent rounding.
SELECT
    ROUND(MAX(ABS(gross_sales - unit_price * quantity)), 4) AS max_gross_sales_difference,
    ROUND(MAX(ABS(net_sales - (gross_sales - discount_amount))), 4) AS max_net_sales_difference
FROM supply_chain;

-- Order-level attributes are expected to be constant within an order.
SELECT order_id
FROM supply_chain
GROUP BY order_id
HAVING COUNT(DISTINCT delivery_status) > 1
    OR COUNT(DISTINCT late_delivery_risk) > 1
    OR COUNT(DISTINCT shipping_mode) > 1
    OR COUNT(DISTINCT order_date) > 1
    OR COUNT(DISTINCT shipping_date) > 1;

