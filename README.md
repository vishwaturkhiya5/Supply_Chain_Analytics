# Supply Chain Analytics

A portfolio-ready **SQL and Excel analytics project** built using the **DataCo Supply Chain dataset**. The project analyzes delivery performance, sales, profitability, customer segments, markets, products, and shipping operations.

It includes a reproducible data-cleaning pipeline, SQLite-based SQL analysis, validated business KPIs, an Excel dashboard, and supporting documentation.

---

## Project Overview

The DataCo Supply Chain dataset contains **180,519 order-item records** representing **65,752 distinct orders** from **January 1, 2015 through January 31, 2018**.

The project focuses on:

* Data cleaning and quality validation
* Sales and profitability analysis
* Delivery-performance analysis
* Customer and market analysis
* Product and category analysis
* Shipping-mode performance
* Monthly and yearly trends
* Advanced SQL analysis using window functions
* Excel dashboard development
* Reproducible business KPI validation

---

## Executive Summary

After cleaning and rounding monetary fields to two decimal places, the dataset reports:

| KPI                              |         Result |
| -------------------------------- | -------------: |
| Total Records                    |        180,519 |
| Distinct Orders                  |         65,752 |
| Gross Sales                      | $36,784,734.31 |
| Net Sales                        | $33,054,402.04 |
| Total Profit                     |  $3,966,902.97 |
| Gross AOV                        |        $559.45 |
| Late-Delivery Rate — Row Grain   |         54.83% |
| Late-Delivery Rate — Order Grain |         54.82% |

The largest operational issue is **delivery performance**. At the order-item level, the late-delivery rate is **54.83%**. At the distinct-order level, **36,048 of 65,752 orders were late**, resulting in a **54.82% late-delivery rate**.

First Class and Second Class shipping show the largest gaps between scheduled and actual delivery performance.

---

## Key Findings

### 1. Delivery Performance

Shipping promises are strongly associated with late deliveries.

* **First Class:** 95.27% late; approximately 2 actual days vs. 1 scheduled day
* **Second Class:** 76.72% late; approximately 4 actual days vs. 2 scheduled days
* **Standard Class:** 38.13% late; approximately 4 actual days vs. 4 scheduled days

This indicates that shipping-mode and SLA performance should be monitored at the distinct-order level.

### 2. Revenue Concentration

Revenue is highly concentrated among a small number of products.

* Top product contributes **18.84%** of gross sales
* Top 5 products contribute **60.58%**
* Top 10 products contribute **89.98%**

This concentration creates potential inventory and supplier-continuity risk.

### 3. Loss-Making Orders

A significant portion of orders are unprofitable.

* **13,908 orders** are loss-making
* This represents **21.15% of all orders**
* These orders generated approximately **$8.09M in gross sales**
* Collectively, they generated approximately **$2.62M in losses**

### 4. Customer Segments

Customer segment does not appear to be a major driver of late deliveries.

The late-delivery rates across:

* Consumer
* Corporate
* Home Office

differ by only approximately **0.35 percentage points**.

### 5. Market Performance

Europe is the largest market by gross sales.

* **Europe:** $10.87M — 29.56% of gross sales
* **LATAM:** $10.28M

### 6. Sales and Order Growth

Order growth did not translate into equivalent sales growth.

Comparing complete years **2015 and 2017**:

* Orders increased by **4.60%**
* Gross sales decreased by **4.31%**
* Gross AOV decreased by **8.52%**

The 2018 data contains only January and is therefore excluded from full-year comparisons.

---

## Business Recommendations

Based on the analysis:

1. Review and reset First Class and Second Class delivery expectations based on observed performance.
2. Monitor shipping-mode and carrier performance using distinct orders as the primary operational grain.
3. Protect inventory availability and supplier continuity for the top-selling products.
4. Develop lower-concentration product alternatives where appropriate.
5. Investigate the **21.15% of loss-making orders** for discount, product, and fulfillment-cost patterns.
6. Prioritize shipping and fulfillment improvements rather than customer-segment-specific delivery policies.
7. Track **gross sales, net sales, discounts, and profit together** to obtain a more complete view of financial performance.
8. Treat 2018 as a partial period and use like-for-like periods for comparisons.

---

## Validated KPIs

| KPI                              | Calculation                   |         Result |
| -------------------------------- | ----------------------------- | -------------: |
| Total Records                    | `COUNT(*)`                    |        180,519 |
| Distinct Orders                  | `COUNT(DISTINCT order_id)`    |         65,752 |
| Gross Sales                      | `SUM(gross_sales)`            | $36,784,734.31 |
| Net Sales                        | `SUM(net_sales)`              | $33,054,402.04 |
| Total Profit                     | `SUM(profit)`                 |  $3,966,902.97 |
| Gross AOV                        | Gross Sales / Distinct Orders |        $559.45 |
| Late-Delivery Rate — Row Grain   | Late-risk rows / all rows     |         54.83% |
| Late-Delivery Rate — Order Grain | Late orders / distinct orders |         54.82% |

### Data Precision

Monetary fields are rounded to two decimal places during cleaning to remove binary floating-point noise.

The raw, unrounded sales sum is **$36,784,735.01**, which is $0.70 higher than the cleaned business total. Both values round to approximately **$36.78M**.

---

## Excel Dashboard

The project includes an Excel dashboard:

`dashboard/Supply_Chain_Analytics_Dashboard.xlsx`

### Dashboard Features

* Six KPI cards:

  * Total Records
  * Distinct Orders
  * Gross Sales
  * Total Profit
  * Gross AOV
  * Late-Delivery Percentage
* Market dropdown filter
* Customer-segment dropdown filter
* Monthly sales trend
* Market analysis
* Customer-segment analysis
* Shipping-mode analysis
* Category analysis
* Product analysis
* Delivery-performance analysis
* Regional analysis
* Monthly and yearly trend summaries

The workbook also contains separate sheets for:

* Metric Validation
* Data Quality
* Dashboard Data
* Data Dictionary
* Workbook Guide

The dashboard uses dropdown controls and formula-linked charts because native PivotTable and slicer export is not reliable in the available authoring environment.

The underlying summary tables are stored as native Excel tables with filter controls and can be regenerated through the project pipeline.

---

## SQL Analysis

The project uses **SQLite** for reproducible SQL analysis.

The SQL scripts demonstrate:

* `GROUP BY`
* `CASE`
* `COUNT(DISTINCT ...)`
* Conditional aggregation
* `NULLIF`
* Common Table Expressions (CTEs)
* Subqueries
* `JOIN`
* `ROW_NUMBER()`
* `LAG()`
* `DENSE_RANK()`
* Window functions
* Windowed share calculations
* KPI analysis
* Customer analysis
* Market analysis
* Region and state analysis
* Shipping analysis
* Delivery analysis
* Product and category analysis
* Monthly and yearly trends
* Top and bottom performers

Every SQL query is executed by the analysis pipeline.

Results are stored under:

```text
outputs/sql_results/
```

The file:

```text
outputs/sql_validation.json
```

contains validation results confirming that the headline SQL metrics reconcile with the processed source data.

---

## Data Cleaning & Quality

The project includes a reproducible data-cleaning pipeline.

The cleaning process includes:

* Data type standardization
* Monetary-field rounding
* Missing-value handling
* Date processing
* Data-quality checks
* Derived business metrics
* Validation of key financial and operational metrics

The cleaned dataset is stored at:

```text
data/processed/dataco_supply_chain_cleaned.csv
```

---

## Project Structure

```text
Supply_Chain_Analytics/
│
├── README.md
│
├── data/
│   └── processed/
│       └── dataco_supply_chain_cleaned.csv
│
├── data_dictionary/
│   ├── DescriptionDataCoSupplyChain.csv
│   └── CLEANED_DATA_DICTIONARY.md
│
├── dashboard/
│   └── Supply_Chain_Analytics_Dashboard.xlsx
│
├── docs/
│   ├── BUSINESS_INSIGHTS.md
│   ├── DATA_CLEANING_AND_QUALITY.md
│   └── METRICS_VALIDATION.md
│
├── outputs/
│   ├── analysis summary CSV/JSON files
│   ├── sql_results/
│   └── sql_validation.json
│
├── scripts/
│   ├── build_data_assets.py
│   ├── run_sql_analysis.py
│   ├── derive_insights.py
│
└── sql/
    ├── 00_create_schema.sql
    ├── 01_data_quality.sql
    ├── 02_kpi_analysis.sql
    ├── 03_business_analysis.sql
    └── 04_advanced_analysis.sql
```

---

## Tech Stack

| Technology      | Purpose                          |
| --------------- | -------------------------------- |
| Python          | Data cleaning and processing     |
| Pandas          | Data transformation and analysis |
| NumPy           | Numerical processing             |
| SQLite          | SQL analysis and KPI validation  |
| SQL             | Business analytics               |
| Microsoft Excel | Dashboard and visualization      |
| Git             | Version control                  |
| GitHub          | Project hosting and portfolio    |

---

##  Reproduce the Analysis

### Prerequisites

Install:

* Python 3.10+
* Pandas
* NumPy
* SQLite

SQLite is included with Python.

Install the Python dependencies using:

```bash
pip install pandas numpy
```

### Step 1 — Obtain the Source Dataset

The original **92 MB** source CSV is intentionally not duplicated inside this repository.

Place:

```text
DataCoSupplyChainDataset.csv
```

in the parent folder of the project.

Alternatively, provide the dataset location using the `--source` argument.

---

### Step 2 — Build the Cleaned Data Assets

From the parent folder, run:

```bash
python Supply_Chain_Analytics/scripts/build_data_assets.py \
  --source DataCoSupplyChainDataset.csv \
  --project-root Supply_Chain_Analytics
```

---

### Step 3 — Run the SQL Analysis

```bash
python Supply_Chain_Analytics/scripts/run_sql_analysis.py \
  --project-root Supply_Chain_Analytics \
  --database Supply_Chain_Analytics/data/processed/supply_chain.db
```

---

### Step 4 — Derive Business Insights

```bash
python Supply_Chain_Analytics/scripts/derive_insights.py \
  --project-root Supply_Chain_Analytics
```

The pipeline generates the processed data, SQLite database, SQL results, validation outputs, and analysis summaries.

---

## Data Source

This project uses the **DataCo Supply Chain dataset** for educational and analytical purposes.

The original source dataset is not included in this repository because of its large file size.

The repository contains the processed analytical assets and the scripts required to reproduce the analysis from the original dataset.

---

## Project Objectives

The main objectives of this project are to:

* Validate business KPIs using SQL
* Clean and prepare supply-chain data
* Analyze sales and profitability
* Identify delivery-performance issues
* Understand customer and market behavior
* Identify revenue concentration
* Analyze loss-making orders
* Build an interactive Excel dashboard
* Demonstrate advanced SQL techniques
* Create a reproducible analytics workflow

---

## Key Takeaways

This project demonstrates how raw supply-chain data can be transformed into actionable business insights through:

**Data Cleaning → SQL Analysis → KPI Validation → Business Analysis → Excel Dashboard → Recommendations**

The analysis highlights delivery-performance issues, revenue concentration, loss-making orders, and differences across markets, products, and shipping modes.

---


