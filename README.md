# Supply Chain Analytics

A portfolio-ready SQL and Excel project built from the DataCo Supply Chain dataset. The project validates headline business metrics, analyzes delivery performance and profitability, and packages reproducible cleaning, SQLite analysis, dashboard data, and documentation.

## Executive Summary

The source contains **180,519 order-item records** representing **65,752 distinct orders** from **January 1, 2015 through January 31, 2018**. After rounding monetary fields to cents, the data reports **$36,784,734.31 in gross sales**, **$33,054,402.04 in net sales after discounts**, and **$3,966,902.97 in profit**.

The largest operational issue is delivery performance. The requested 54.83% late-delivery claim is reproducible at the order-item row grain. At the more appropriate distinct-order grain, **36,048 of 65,752 orders were late, or 54.82%**. First Class and Second Class underperform their promised schedules most severely.

## Validated KPIs

| KPI | Calculation | Result | Resume claim assessment |
|---|---|---:|---|
| Total records | `COUNT(*)` | 180,519 | `180K+` verified |
| Distinct orders | `COUNT(DISTINCT order_id)` | 65,752 | Use `65.75K` or `65.8K`; `65.7K` is truncated |
| Gross sales | `SUM(gross_sales)` | $36,784,734.31 | `$36.78M` verified as gross sales |
| Net sales | `SUM(net_sales)` | $33,054,402.04 | Additional context; excludes $3.73M in discounts |
| Total profit | `SUM(profit)` | $3,966,902.97 | `$3.97M` verified |
| Gross AOV | Gross sales / distinct orders | $559.4466 | Correct two-decimal value is **$559.45**, not $559.46 |
| Late-delivery rate, row grain | Late-risk rows / all rows | 54.8291% | `54.83%` verified at order-item grain |
| Late-delivery rate, order grain | Late orders / distinct orders | 54.8242% | Use **54.82%** when describing orders |

Monetary fields are rounded to two decimals per line during cleaning to remove binary floating-point noise. The raw unrounded `Sales` sum is $36,784,735.01, only $0.70 higher than the cleaned business total; both round to $36.78M.

## Key Findings

1. **Shipping promises drive late deliveries.** First Class is late on 95.27% of orders and averages 2 actual days against 1 scheduled day. Second Class is late on 76.72% and averages 4.00 days against 2 scheduled days. Standard Class performs much better at 38.13% late and averages 4.00 days against 4 scheduled days.
2. **Revenue is highly concentrated.** The top product contributes 18.84% of gross sales, the top five contribute 60.58%, and the top ten contribute 89.98%. This creates inventory and supplier-continuity risk.
3. **Loss-making orders are material.** 13,908 orders, or 21.15%, have negative total profit. Those orders generated $8.09M in gross sales but collectively lost $2.62M.
4. **Customer segment is not the main delivery driver.** Late-delivery rates across Consumer, Corporate, and Home Office differ by only 0.35 percentage points.
5. **Europe is the largest market.** It produces $10.87M, or 29.56% of gross sales. LATAM follows with $10.28M.
6. **Order growth did not translate into sales growth.** From complete-year 2015 to 2017, orders increased 4.60% while gross sales decreased 4.31% and gross AOV decreased 8.52%. The late-2017 drop reflects a sharp change in order value and product mix; 2018 contains only January and is not used for annual comparisons.

## Recommendations

- Reset First Class and Second Class delivery promises to observed performance, then measure carrier/SLA changes at distinct-order grain.
- Protect availability and supplier continuity for the top ten products, while developing lower-concentration alternatives.
- Add margin guardrails at product and order level. Review discount combinations and fulfillment costs for the 21.15% of loss-making orders.
- Prioritize shipping-mode and carrier improvements over customer-segment-specific delivery policies.
- Track gross sales, net sales, discounts, and profit together. Gross sales alone overstates realized revenue by approximately $3.73M.
- Keep 2018 labeled as a partial period and compare only like-for-like complete months or years.

## Excel Dashboard

`dashboard/Supply_Chain_Analytics_Dashboard.xlsx` includes:

- Six KPI cards: records, orders, gross sales, profit, gross AOV, and late-delivery percentage
- Market and customer-segment dropdown filters that update the KPI cards and monthly trend
- Native Excel charts for monthly sales, markets, customer segments, shipping modes, and categories
- Pivot-style summary tables for segments, markets, regions, shipping, delivery, products, categories, monthly trends, and yearly trends
- Separate metric-validation, data-quality, dashboard-data, data-dictionary, and workbook-guide sheets

The workbook uses dropdown controls and formula-linked charts because native PivotTable and slicer export is not reliable in the available authoring engine. The summary tables are refreshable by rerunning the included pipeline and are stored as native Excel tables with filter buttons.

## SQL Coverage

The SQLite scripts demonstrate:

- `GROUP BY`, `CASE`, `COUNT(DISTINCT ...)`, conditional aggregation, and `NULLIF`
- CTEs and subqueries
- `JOIN` operations at distinct-order grain
- `ROW_NUMBER`, `LAG`, `DENSE_RANK`, and windowed share calculations
- KPI, customer, market, region/state, shipping, delivery, product/category, monthly/yearly, and top/bottom analyses

Every SQL query is executed by the pipeline. Results are saved under `outputs/sql_results/`, and `outputs/sql_validation.json` confirms that all headline SQL metrics reconcile to the processed source.

## Project Structure

```text
Supply_Chain_Analytics/
├── README.md
├── data/
│   └── processed/
│       └── dataco_supply_chain_cleaned.csv
├── data_dictionary/
│   ├── DescriptionDataCoSupplyChain.csv
│   └── CLEANED_DATA_DICTIONARY.md
├── dashboard/
│   └── Supply_Chain_Analytics_Dashboard.xlsx
├── docs/
│   ├── BUSINESS_INSIGHTS.md
│   ├── DATA_CLEANING_AND_QUALITY.md
│   └── METRICS_VALIDATION.md
├── outputs/
│   ├── analysis summary CSV/JSON files
│   └── sql_results/
├── scripts/
│   ├── build_data_assets.py
│   ├── run_sql_analysis.py
│   ├── derive_insights.py
│   └── build_excel_dashboard.mjs
└── sql/
    ├── 00_create_schema.sql
    ├── 01_data_quality.sql
    ├── 02_kpi_analysis.sql
    ├── 03_business_analysis.sql
    └── 04_advanced_analysis.sql
```

The original 92 MB source CSV is intentionally not duplicated inside the project. Place `DataCoSupplyChainDataset.csv` beside the project before running the pipeline, or pass its location with `--source`.

The SQLite database is also generated locally rather than committed because it is a large reproducible binary. The included SQL runner recreates `data/processed/supply_chain.db` from the cleaned CSV.

## Reproduce the Analysis

From the parent folder:

```bash
python Supply_Chain_Analytics/scripts/build_data_assets.py \
  --source DataCoSupplyChainDataset.csv \
  --project-root Supply_Chain_Analytics

python Supply_Chain_Analytics/scripts/run_sql_analysis.py \
  --project-root Supply_Chain_Analytics \
  --database Supply_Chain_Analytics/data/processed/supply_chain.db

python Supply_Chain_Analytics/scripts/derive_insights.py \
  --project-root Supply_Chain_Analytics
```

Python dependencies: `pandas` and `numpy`. SQLite is included with Python.

The delivered Excel workbook can be used directly. Its build script uses `@oai/artifact-tool` in the Codex primary runtime.


