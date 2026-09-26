# Data Cleaning and Quality Assessment

## Source Profile

- Raw rows: 180,519
- Raw columns: 53
- Date range: January 1, 2015 to January 31, 2018
- Shipping-date range: January 3, 2015 to February 6, 2018
- Grain: one record per order item
- Candidate primary key: `Order Item Id`
- Exact duplicate rows: 0
- Distinct orders: 65,752
- Distinct customers: 20,652
- Distinct products: 118

## Transformations

1. Read the ISO-8859-1 source and normalize all headers to descriptive `snake_case` names.
2. Trim surrounding whitespace from text fields.
3. Parse order and shipping timestamps; no parsing failures were found.
4. Round monetary fields to two decimals per row to remove binary floating-point noise.
5. Add `shipping_variance_days = actual_shipping_days - scheduled_shipping_days`.
6. Add order year, month, and year-month fields for trend analysis.
7. Retain the source late-risk flag and add a matching `is_late` field.
8. Remove direct personal information and unused sensitive fields from the processed file: customer name, email, password, street, coordinates, ZIP code, and product-image URL.
9. Remove fully empty or redundant fields, including Product Description, duplicated product/category IDs, duplicated benefit/profit, and duplicated net-sales fields.
10. Export an UTF-8 processed CSV with 42 analysis-ready columns.

## Missing Values

| Raw field | Missing | Rate | Treatment |
|---|---:|---:|---|
| Product Description | 180,519 | 100.00% | Removed |
| Order Zipcode | 155,679 | 86.24% | Removed; country/state retained |
| Customer Lname | 8 | 0.004% | Removed with other PII |
| Customer Zipcode | 3 | 0.002% | Removed with other PII |

No required analytical key, date, sales, profit, shipping-mode, delivery-status, product, category, customer-segment, market, or region field is missing.

## Integrity Checks

- `Order Item Id` is unique across all records.
- Order/customer IDs, product IDs, and category IDs agree across their duplicated source fields.
- No negative quantities or gross-sales values occur.
- All discount rates fall between 0 and 1.
- No shipping timestamp occurs before its order timestamp.
- The late-risk flag matches `Delivery Status = 'Late delivery'` on every record.
- Order date, shipping date, delivery status, late flag, shipping mode, and geography are constant within each Order Id.

## Documented Source Quirks

- 9,737 rows have an exact timestamp duration that differs from the supplied integer `Days for shipping (real)` by one-half day. The source shipping-day field is used for KPI consistency because it drives the delivery-status logic.
- The `Order Profit Per Order` label is misleading at flat-file grain. Values vary by order item, so it is treated as line-item profit before order-level aggregation.
- Negative profit and profit ratios below -100% are retained. They represent real loss-making records, not type errors.
- 2018 contains only January and is not comparable with complete calendar years.

The full check table is available in `outputs/data_quality_summary.csv`, and executable SQL checks are in `sql/01_data_quality.sql`.

