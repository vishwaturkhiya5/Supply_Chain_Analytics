-- Top and bottom products, trends, and concentration using CTEs/subqueries/
-- window functions.

WITH product_performance AS (
    SELECT
        product_id,
        product_name,
        category_name,
        COUNT(DISTINCT order_id) AS orders,
        SUM(quantity) AS units,
        SUM(gross_sales) AS gross_sales,
        SUM(net_sales) AS net_sales,
        SUM(profit) AS profit
    FROM supply_chain
    GROUP BY product_id, product_name, category_name
), ranked AS (
    SELECT *,
        DENSE_RANK() OVER (ORDER BY gross_sales DESC) AS sales_rank,
        DENSE_RANK() OVER (ORDER BY profit DESC) AS profit_rank,
        DENSE_RANK() OVER (ORDER BY profit ASC) AS bottom_profit_rank,
        SUM(gross_sales) OVER () AS all_product_sales
    FROM product_performance
)
SELECT
    product_id,
    product_name,
    category_name,
    orders,
    units,
    ROUND(gross_sales, 2) AS gross_sales,
    ROUND(profit, 2) AS profit,
    ROUND(100.0 * profit / net_sales, 2) AS profit_margin_pct,
    ROUND(100.0 * gross_sales / all_product_sales, 2) AS sales_share_pct,
    sales_rank,
    profit_rank,
    bottom_profit_rank
FROM ranked
WHERE sales_rank <= 10 OR bottom_profit_rank <= 10
ORDER BY sales_rank;

-- Monthly year-over-year growth based on comparable calendar months.
WITH monthly AS (
    SELECT
        order_year_month,
        SUM(gross_sales) AS gross_sales,
        SUM(profit) AS profit
    FROM supply_chain
    GROUP BY order_year_month
), compared AS (
    SELECT *,
        LAG(gross_sales, 12) OVER (ORDER BY order_year_month) AS prior_year_sales,
        LAG(profit, 12) OVER (ORDER BY order_year_month) AS prior_year_profit
    FROM monthly
)
SELECT
    order_year_month,
    ROUND(gross_sales, 2) AS gross_sales,
    ROUND(profit, 2) AS profit,
    ROUND(100.0 * (gross_sales / NULLIF(prior_year_sales, 0) - 1), 2) AS sales_yoy_pct,
    ROUND(100.0 * (profit / NULLIF(prior_year_profit, 0) - 1), 2) AS profit_yoy_pct
FROM compared
ORDER BY order_year_month;

-- Annual regional trends and each region's share of annual sales.
WITH regional_year AS (
    SELECT
        order_year,
        order_region,
        SUM(gross_sales) AS gross_sales,
        SUM(profit) AS profit
    FROM supply_chain
    GROUP BY order_year, order_region
)
SELECT
    order_year,
    order_region,
    ROUND(gross_sales, 2) AS gross_sales,
    ROUND(profit, 2) AS profit,
    ROUND(100.0 * gross_sales / SUM(gross_sales) OVER (PARTITION BY order_year), 2) AS annual_sales_share_pct,
    DENSE_RANK() OVER (PARTITION BY order_year ORDER BY gross_sales DESC) AS annual_region_rank
FROM regional_year
ORDER BY order_year, annual_region_rank;

-- Categories that destroy value despite meaningful sales.
WITH category_profit AS (
    SELECT
        category_name,
        COUNT(DISTINCT order_id) AS orders,
        SUM(gross_sales) AS gross_sales,
        SUM(net_sales) AS net_sales,
        SUM(profit) AS profit
    FROM supply_chain
    GROUP BY category_name
)
SELECT
    category_name,
    orders,
    ROUND(gross_sales, 2) AS gross_sales,
    ROUND(profit, 2) AS profit,
    ROUND(100.0 * profit / net_sales, 2) AS profit_margin_pct
FROM category_profit
WHERE profit < 0
ORDER BY profit ASC;

