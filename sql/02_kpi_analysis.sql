-- Headline metrics. Gross sales uses the source Sales field, rounded to cents
-- during cleaning. AOV is gross sales divided by distinct orders.

WITH headline AS (
    SELECT
        COUNT(*) AS total_records,
        COUNT(DISTINCT order_id) AS total_orders,
        SUM(quantity) AS total_units,
        SUM(gross_sales) AS total_sales,
        SUM(net_sales) AS net_sales,
        SUM(discount_amount) AS total_discount,
        SUM(profit) AS total_profit,
        SUM(late_delivery_risk) AS late_records
    FROM supply_chain
)
SELECT
    total_records,
    total_orders,
    total_units,
    ROUND(total_sales, 2) AS total_sales,
    ROUND(net_sales, 2) AS net_sales,
    ROUND(total_discount, 2) AS total_discount,
    ROUND(total_profit, 2) AS total_profit,
    ROUND(total_sales / total_orders, 2) AS gross_aov,
    ROUND(net_sales / total_orders, 2) AS net_aov,
    ROUND(100.0 * total_profit / net_sales, 2) AS profit_margin_pct,
    ROUND(100.0 * late_records / total_records, 2) AS late_delivery_rate_row_pct
FROM headline;

-- Operational late rate at distinct-order grain. Attributes are invariant
-- within each order, so ROW_NUMBER safely selects one operational record.
WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_item_id) AS rn
    FROM supply_chain
)
SELECT
    COUNT(*) AS total_orders,
    SUM(late_delivery_risk) AS late_orders,
    ROUND(100.0 * AVG(late_delivery_risk), 2) AS late_delivery_rate_order_pct,
    ROUND(AVG(actual_shipping_days), 2) AS avg_actual_shipping_days,
    ROUND(AVG(scheduled_shipping_days), 2) AS avg_scheduled_shipping_days,
    ROUND(AVG(shipping_variance_days), 2) AS avg_shipping_variance_days
FROM ranked
WHERE rn = 1;

