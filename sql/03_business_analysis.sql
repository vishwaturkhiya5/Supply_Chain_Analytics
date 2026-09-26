-- Customer-segment performance.
SELECT
    customer_segment,
    COUNT(*) AS records,
    COUNT(DISTINCT order_id) AS orders,
    SUM(quantity) AS units,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(net_sales), 2) AS net_sales,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(100.0 * SUM(profit) / SUM(net_sales), 2) AS profit_margin_pct,
    ROUND(100.0 * AVG(late_delivery_risk), 2) AS late_delivery_rate_pct
FROM supply_chain
GROUP BY customer_segment
ORDER BY gross_sales DESC;

-- Market and regional performance.
SELECT
    market,
    order_region,
    COUNT(DISTINCT order_id) AS orders,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(100.0 * SUM(profit) / SUM(net_sales), 2) AS profit_margin_pct,
    ROUND(100.0 * AVG(late_delivery_risk), 2) AS late_delivery_rate_pct
FROM supply_chain
GROUP BY market, order_region
ORDER BY gross_sales DESC;

-- State-level ranking within each country.
WITH state_sales AS (
    SELECT
        order_country,
        order_state,
        COUNT(DISTINCT order_id) AS orders,
        SUM(gross_sales) AS gross_sales,
        SUM(profit) AS profit
    FROM supply_chain
    GROUP BY order_country, order_state
), ranked AS (
    SELECT *,
        DENSE_RANK() OVER (PARTITION BY order_country ORDER BY gross_sales DESC) AS sales_rank_in_country
    FROM state_sales
)
SELECT
    order_country,
    order_state,
    orders,
    ROUND(gross_sales, 2) AS gross_sales,
    ROUND(profit, 2) AS profit,
    sales_rank_in_country
FROM ranked
WHERE sales_rank_in_country <= 5
ORDER BY order_country, sales_rank_in_country;

-- Shipping-mode performance at order grain, joining order totals to one
-- operational record per order to avoid weighting by line count.
WITH order_totals AS (
    SELECT order_id,
           SUM(gross_sales) AS order_sales,
           SUM(net_sales) AS order_net_sales,
           SUM(profit) AS order_profit
    FROM supply_chain
    GROUP BY order_id
), order_attributes AS (
    SELECT order_id, shipping_mode, delivery_status, late_delivery_risk,
           actual_shipping_days, scheduled_shipping_days, shipping_variance_days
    FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_item_id) AS rn
        FROM supply_chain
    )
    WHERE rn = 1
)
SELECT
    a.shipping_mode,
    COUNT(*) AS orders,
    ROUND(SUM(t.order_sales), 2) AS gross_sales,
    ROUND(SUM(t.order_profit), 2) AS profit,
    ROUND(100.0 * AVG(a.late_delivery_risk), 2) AS late_delivery_rate_pct,
    ROUND(AVG(a.actual_shipping_days), 2) AS avg_actual_shipping_days,
    ROUND(AVG(a.scheduled_shipping_days), 2) AS avg_scheduled_shipping_days,
    ROUND(AVG(a.shipping_variance_days), 2) AS avg_variance_days
FROM order_attributes a
JOIN order_totals t ON t.order_id = a.order_id
GROUP BY a.shipping_mode
ORDER BY late_delivery_rate_pct DESC;

-- Delivery status mix.
SELECT
    delivery_status,
    COUNT(DISTINCT order_id) AS orders,
    ROUND(100.0 * COUNT(DISTINCT order_id) /
          SUM(COUNT(DISTINCT order_id)) OVER (), 2) AS order_share_pct,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(profit), 2) AS profit
FROM supply_chain
GROUP BY delivery_status
ORDER BY orders DESC;

-- Category performance.
SELECT
    category_name,
    COUNT(DISTINCT order_id) AS orders,
    SUM(quantity) AS units,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(100.0 * SUM(profit) / SUM(net_sales), 2) AS profit_margin_pct,
    ROUND(100.0 * AVG(late_delivery_risk), 2) AS late_delivery_rate_pct
FROM supply_chain
GROUP BY category_name
ORDER BY gross_sales DESC;

-- Monthly trend.
SELECT
    order_year_month,
    COUNT(DISTINCT order_id) AS orders,
    SUM(quantity) AS units,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(profit), 2) AS profit,
    ROUND(100.0 * AVG(late_delivery_risk), 2) AS late_delivery_rate_pct
FROM supply_chain
GROUP BY order_year_month
ORDER BY order_year_month;

-- Yearly trend. 2018 contains January only and must not be compared directly
-- with the complete 2015-2017 calendar years.
SELECT
    order_year,
    COUNT(DISTINCT order_id) AS orders,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(profit), 2) AS profit,
    CASE WHEN order_year = 2018 THEN 'January only' ELSE 'Full year' END AS period_note
FROM supply_chain
GROUP BY order_year
ORDER BY order_year;

