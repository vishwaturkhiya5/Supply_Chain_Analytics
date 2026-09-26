# Cleaned Data Dictionary

The processed dataset uses one row per order item and contains 42 columns.

| Column | Type | Definition |
|---|---|---|
| transaction_type | text | Payment transaction type |
| actual_shipping_days | integer | Source-reported actual shipping duration |
| scheduled_shipping_days | integer | Scheduled shipping duration |
| delivery_status | text | Advance, late, canceled, or on-time delivery classification |
| late_delivery_risk | integer | 1 for late delivery, otherwise 0 |
| category_id | integer | Product category identifier |
| category_name | text | Product category name |
| customer_city | text | Customer city |
| customer_country | text | Customer country |
| customer_id | integer | Deidentified customer identifier |
| customer_segment | text | Consumer, Corporate, or Home Office |
| customer_state | text | Customer state |
| department_id | integer | Department identifier |
| department_name | text | Department name |
| market | text | Africa, Europe, LATAM, Pacific Asia, or USCA |
| order_city | text | Destination city |
| order_country | text | Destination country |
| order_date | datetime text | Order timestamp in `YYYY-MM-DD HH:MM:SS` |
| order_id | integer | Order identifier; repeats across line items |
| discount_amount | currency | Order-item discount amount |
| discount_rate | decimal | Order-item discount percentage as 0-1 |
| order_item_id | integer | Unique order-item identifier and candidate primary key |
| unit_price | currency | Product price before discount |
| profit_ratio | decimal | Source order-item profit ratio |
| quantity | integer | Units on the order item |
| gross_sales | currency | Source Sales value before discount |
| net_sales | currency | Order Item Total after discount |
| profit | currency | Order-item profit |
| order_region | text | Destination business region |
| order_state | text | Destination state |
| order_status | text | Commercial order status |
| product_id | integer | Product identifier |
| product_name | text | Product name |
| product_price | currency | Product list price |
| product_status | integer | Source stock-status flag |
| shipping_date | datetime text | Shipment timestamp in `YYYY-MM-DD HH:MM:SS` |
| shipping_mode | text | Standard, First, Second, or Same Day |
| shipping_variance_days | integer | Actual shipping days minus scheduled days |
| is_late | integer | Analysis-friendly copy of the late-risk flag |
| order_year | integer | Order calendar year |
| order_month | integer | Order calendar month number |
| order_year_month | text | Order month in `YYYY-MM` format |

