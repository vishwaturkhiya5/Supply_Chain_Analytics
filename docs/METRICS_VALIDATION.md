# Metrics Validation

## Controlling Source

All metrics use `DataCoSupplyChainDataset.csv`. `DescriptionDataCoSupplyChain.csv` is used only to interpret field definitions.

The source grain is one row per order item. `Order Item Id` is unique across all 180,519 records; `Order Id` repeats because an order can contain one to five line items.

## Calculation Definitions

### Total Records

```sql
SELECT COUNT(*) FROM supply_chain;
```

Result: **180,519**. The `180K+` claim is verified.

### Distinct Orders

```sql
SELECT COUNT(DISTINCT order_id) FROM supply_chain;
```

Result: **65,752**. This is 65.752K, normally shown as **65.75K** or **65.8K**. The stated 65.7K is a truncation, not standard rounding.

### Total Sales

The source dictionary defines `Sales` as sales value. This project renames it `gross_sales`. It equals product price multiplied by quantity before the order-item discount.

```sql
SELECT ROUND(SUM(gross_sales), 2) FROM supply_chain;
```

Result after cent-level cleaning: **$36,784,734.31**, which supports `$36.78M`.

The raw unrounded float sum is $36,784,735.01. The $0.70 difference is caused by floating-point noise in individual monetary values. Rounding each monetary record to cents is the documented business rule.

`Order Item Total`, renamed `net_sales`, totals **$33,054,402.04** and represents sales after discounts. Therefore, `$36.78M sales` must be labeled **gross sales**, not net revenue.

### Total Profit

```sql
SELECT ROUND(SUM(profit), 2) FROM supply_chain;
```

Result: **$3,966,902.97**, which rounds to `$3.97M`.

Although the source field is named `Order Profit Per Order`, its values vary across lines in multi-line orders and behave as line-item profit. Summing at line-item grain is therefore correct.

### Average Order Value

```sql
SELECT SUM(gross_sales) / COUNT(DISTINCT order_id) FROM supply_chain;
```

Result: **$559.446622**, which rounds to **$559.45**, not $559.46.

Net AOV after discounts is **$502.71**.

### Late-Delivery Rate

The requested claim is reproduced with the source `Late_delivery_risk` field at row grain:

```sql
SELECT 100.0 * SUM(late_delivery_risk) / COUNT(*) FROM supply_chain;
```

98,977 late-risk records / 180,519 records = **54.8291%**, displayed as **54.83%**.

Delivery is an order-level outcome, so the operational KPI should deduplicate orders:

36,048 late orders / 65,752 distinct orders = **54.8242%**, displayed as **54.82%**.

The small difference occurs because orders contain different numbers of line items. The dashboard preserves the requested 54.83% headline and shows the order-level rate on the Shipping sheet.

## Validation Status

All headline totals reconcile between the independent Python aggregation and executed SQLite queries. See `outputs/sql_validation.json` for the automated check results.

