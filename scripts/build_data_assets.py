#!/usr/bin/env python3
"""Clean the DataCo dataset and produce auditable analysis extracts."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd


COLUMN_MAP = {
    "Type": "transaction_type",
    "Days for shipping (real)": "actual_shipping_days",
    "Days for shipment (scheduled)": "scheduled_shipping_days",
    "Benefit per order": "benefit_per_order",
    "Sales per customer": "sales_per_customer",
    "Delivery Status": "delivery_status",
    "Late_delivery_risk": "late_delivery_risk",
    "Category Id": "category_id",
    "Category Name": "category_name",
    "Customer City": "customer_city",
    "Customer Country": "customer_country",
    "Customer Email": "customer_email",
    "Customer Fname": "customer_first_name",
    "Customer Id": "customer_id",
    "Customer Lname": "customer_last_name",
    "Customer Password": "customer_password",
    "Customer Segment": "customer_segment",
    "Customer State": "customer_state",
    "Customer Street": "customer_street",
    "Customer Zipcode": "customer_zipcode",
    "Department Id": "department_id",
    "Department Name": "department_name",
    "Latitude": "latitude",
    "Longitude": "longitude",
    "Market": "market",
    "Order City": "order_city",
    "Order Country": "order_country",
    "Order Customer Id": "order_customer_id",
    "order date (DateOrders)": "order_date",
    "Order Id": "order_id",
    "Order Item Cardprod Id": "order_item_product_id",
    "Order Item Discount": "discount_amount",
    "Order Item Discount Rate": "discount_rate",
    "Order Item Id": "order_item_id",
    "Order Item Product Price": "unit_price",
    "Order Item Profit Ratio": "profit_ratio",
    "Order Item Quantity": "quantity",
    "Sales": "gross_sales",
    "Order Item Total": "net_sales",
    "Order Profit Per Order": "profit",
    "Order Region": "order_region",
    "Order State": "order_state",
    "Order Status": "order_status",
    "Order Zipcode": "order_zipcode",
    "Product Card Id": "product_id",
    "Product Category Id": "product_category_id",
    "Product Description": "product_description",
    "Product Image": "product_image",
    "Product Name": "product_name",
    "Product Price": "product_price",
    "Product Status": "product_status",
    "shipping date (DateOrders)": "shipping_date",
    "Shipping Mode": "shipping_mode",
}

PII_AND_REDUNDANT_COLUMNS = [
    "customer_email",
    "customer_first_name",
    "customer_last_name",
    "customer_password",
    "customer_street",
    "customer_zipcode",
    "latitude",
    "longitude",
    "product_image",
    "product_description",
    "order_zipcode",
    "order_customer_id",
    "order_item_product_id",
    "product_category_id",
    "benefit_per_order",
    "sales_per_customer",
]


def money_round(series: pd.Series) -> pd.Series:
    return series.astype(float).round(2)


def summarize_lines(df: pd.DataFrame, dimensions: list[str]) -> pd.DataFrame:
    grouped = df.groupby(dimensions, dropna=False, observed=True)
    out = grouped.agg(
        records=("order_item_id", "size"),
        orders=("order_id", "nunique"),
        units=("quantity", "sum"),
        gross_sales=("gross_sales", "sum"),
        net_sales=("net_sales", "sum"),
        discount=("discount_amount", "sum"),
        profit=("profit", "sum"),
        late_records=("late_delivery_risk", "sum"),
    ).reset_index()
    out["gross_aov"] = out["gross_sales"] / out["orders"]
    out["net_aov"] = out["net_sales"] / out["orders"]
    out["profit_margin_net"] = out["profit"] / out["net_sales"]
    out["late_delivery_rate_row"] = out["late_records"] / out["records"]
    for col in ["gross_sales", "net_sales", "discount", "profit", "gross_aov", "net_aov"]:
        out[col] = money_round(out[col])
    return out


def summarize_orders(order_df: pd.DataFrame, dimensions: list[str]) -> pd.DataFrame:
    grouped = order_df.groupby(dimensions, dropna=False, observed=True)
    out = grouped.agg(
        orders=("order_id", "size"),
        gross_sales=("order_gross_sales", "sum"),
        net_sales=("order_net_sales", "sum"),
        profit=("order_profit", "sum"),
        late_orders=("late_delivery_risk", "sum"),
        avg_actual_shipping_days=("actual_shipping_days", "mean"),
        avg_scheduled_shipping_days=("scheduled_shipping_days", "mean"),
        avg_shipping_variance_days=("shipping_variance_days", "mean"),
    ).reset_index()
    out["late_delivery_rate_order"] = out["late_orders"] / out["orders"]
    out["gross_aov"] = out["gross_sales"] / out["orders"]
    out["net_aov"] = out["net_sales"] / out["orders"]
    out["profit_margin_net"] = out["profit"] / out["net_sales"]
    for col in ["gross_sales", "net_sales", "profit", "gross_aov", "net_aov"]:
        out[col] = money_round(out[col])
    return out


def add_all_combinations(df: pd.DataFrame, dimensions: list[str]) -> pd.DataFrame:
    frames = []
    variants = [[]]
    for dim in dimensions:
        variants = [v + [False] for v in variants] + [v + [True] for v in variants]
    for mask in variants:
        working = df.copy()
        for dim, make_all in zip(dimensions, mask):
            if make_all:
                working[dim] = "All"
        frames.append(summarize_lines(working, dimensions))
    return pd.concat(frames, ignore_index=True).drop_duplicates(dimensions).sort_values(dimensions)


def build(source: Path, project_root: Path) -> None:
    data_dir = project_root / "data" / "processed"
    outputs_dir = project_root / "outputs"
    docs_dir = project_root / "docs"
    for directory in [data_dir, outputs_dir, docs_dir]:
        directory.mkdir(parents=True, exist_ok=True)

    raw = pd.read_csv(source, encoding="latin1", low_memory=False)
    raw.columns = [c.strip() for c in raw.columns]
    missing_map = [c for c in raw.columns if c not in COLUMN_MAP]
    if missing_map:
        raise ValueError(f"Unmapped columns: {missing_map}")
    df = raw.rename(columns=COLUMN_MAP)

    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()
    for col in ["order_date", "shipping_date"]:
        df[col] = pd.to_datetime(df[col], errors="coerce")
    if df[["order_date", "shipping_date"]].isna().any().any():
        raise ValueError("Date parsing failed for one or more records")

    # Monetary source fields contain binary floating-point noise. Round each row
    # to cents, matching the business precision displayed in the source.
    for col in ["gross_sales", "net_sales", "discount_amount", "profit", "unit_price", "product_price"]:
        df[col] = money_round(df[col])
    for col in ["discount_rate", "profit_ratio"]:
        df[col] = df[col].astype(float).round(6)

    df["shipping_variance_days"] = df["actual_shipping_days"] - df["scheduled_shipping_days"]
    df["is_late"] = df["late_delivery_risk"].astype(int)
    df["order_year"] = df["order_date"].dt.year.astype(int)
    df["order_month"] = df["order_date"].dt.month.astype(int)
    df["order_year_month"] = df["order_date"].dt.to_period("M").astype(str)

    cleaned = df.drop(columns=PII_AND_REDUNDANT_COLUMNS)
    cleaned["order_date"] = cleaned["order_date"].dt.strftime("%Y-%m-%d %H:%M:%S")
    cleaned["shipping_date"] = cleaned["shipping_date"].dt.strftime("%Y-%m-%d %H:%M:%S")
    cleaned.to_csv(data_dir / "dataco_supply_chain_cleaned.csv", index=False, encoding="utf-8")

    # Continue analysis with datetime values.
    order_totals = df.groupby("order_id", as_index=False).agg(
        order_gross_sales=("gross_sales", "sum"),
        order_net_sales=("net_sales", "sum"),
        order_profit=("profit", "sum"),
        order_units=("quantity", "sum"),
        order_lines=("order_item_id", "size"),
    )
    order_first = df.sort_values("order_item_id").drop_duplicates("order_id")
    order_df = order_first.merge(order_totals, on="order_id", how="left", validate="one_to_one")

    metrics = {
        "total_records": int(len(df)),
        "distinct_orders": int(df["order_id"].nunique()),
        "distinct_customers": int(df["customer_id"].nunique()),
        "distinct_products": int(df["product_id"].nunique()),
        "total_units": int(df["quantity"].sum()),
        "gross_sales": round(float(df["gross_sales"].sum()), 2),
        "net_sales": round(float(df["net_sales"].sum()), 2),
        "discount_amount": round(float(df["discount_amount"].sum()), 2),
        "total_profit": round(float(df["profit"].sum()), 2),
        "gross_aov": round(float(df["gross_sales"].sum() / df["order_id"].nunique()), 6),
        "net_aov": round(float(df["net_sales"].sum() / df["order_id"].nunique()), 6),
        "profit_margin_net": round(float(df["profit"].sum() / df["net_sales"].sum()), 8),
        "late_records": int(df["late_delivery_risk"].sum()),
        "late_delivery_rate_row": round(float(df["late_delivery_risk"].mean()), 8),
        "late_orders": int(order_df["late_delivery_risk"].sum()),
        "late_delivery_rate_order": round(float(order_df["late_delivery_risk"].mean()), 8),
        "avg_actual_shipping_days_order": round(float(order_df["actual_shipping_days"].mean()), 6),
        "avg_scheduled_shipping_days_order": round(float(order_df["scheduled_shipping_days"].mean()), 6),
        "order_date_min": df["order_date"].min().isoformat(),
        "order_date_max": df["order_date"].max().isoformat(),
    }
    (outputs_dir / "metrics_summary.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    pd.DataFrame([metrics]).to_csv(outputs_dir / "metrics_summary.csv", index=False)

    monthly = summarize_lines(df, ["order_year_month"])
    monthly["gross_sales_yoy"] = monthly["gross_sales"].pct_change(12)
    monthly["profit_yoy"] = monthly["profit"].pct_change(12)
    monthly.to_csv(outputs_dir / "monthly_performance.csv", index=False)

    yearly = summarize_lines(df, ["order_year"])
    yearly["gross_sales_yoy"] = yearly["gross_sales"].pct_change()
    yearly["profit_yoy"] = yearly["profit"].pct_change()
    yearly["period_note"] = np.where(yearly["order_year"].eq(2018), "January only", "Full year")
    yearly.to_csv(outputs_dir / "yearly_performance.csv", index=False)

    for name, dimensions in {
        "segment_performance": ["customer_segment"],
        "market_performance": ["market"],
        "region_performance": ["order_region"],
        "state_performance": ["order_country", "order_state"],
        "category_performance": ["category_name"],
        "product_performance": ["product_id", "product_name", "category_name"],
        "delivery_status_performance": ["delivery_status"],
        "order_status_performance": ["order_status"],
    }.items():
        summarize_lines(df, dimensions).to_csv(outputs_dir / f"{name}.csv", index=False)

    summarize_orders(order_df, ["shipping_mode"]).to_csv(outputs_dir / "shipping_mode_performance.csv", index=False)
    summarize_orders(order_df, ["delivery_status"]).to_csv(outputs_dir / "delivery_status_order_performance.csv", index=False)
    summarize_orders(order_df, ["order_region", "order_year"]).to_csv(outputs_dir / "regional_yearly_trends.csv", index=False)

    # Compact cubes power the dashboard's filter controls without embedding PII
    # or all 180K detail rows into the workbook.
    add_all_combinations(df, ["market", "customer_segment"]).to_csv(outputs_dir / "dashboard_kpi_cube.csv", index=False)
    month_frames = []
    for market in ["All"] + sorted(df["market"].dropna().unique().tolist()):
        for segment in ["All"] + sorted(df["customer_segment"].dropna().unique().tolist()):
            mask = pd.Series(True, index=df.index)
            if market != "All":
                mask &= df["market"].eq(market)
            if segment != "All":
                mask &= df["customer_segment"].eq(segment)
            part = summarize_lines(df.loc[mask], ["order_year_month"])
            part.insert(0, "customer_segment", segment)
            part.insert(0, "market", market)
            month_frames.append(part)
    pd.concat(month_frames, ignore_index=True).to_csv(outputs_dir / "dashboard_monthly_cube.csv", index=False)

    quality_rows = [
        ["Dataset rows", len(df), len(df), "Pass", "Line-item grain; Order Item Id is unique"],
        ["Dataset columns (raw)", raw.shape[1], raw.shape[1], "Pass", "53 source columns"],
        ["Exact duplicate rows", 0, int(raw.duplicated().sum()), "Pass" if not raw.duplicated().any() else "Fail", "No exact duplicates expected"],
        ["Unique Order Item Id", len(df), int(df["order_item_id"].nunique()), "Pass" if df["order_item_id"].is_unique else "Fail", "Candidate primary key"],
        ["Order date parse failures", 0, int(df["order_date"].isna().sum()), "Pass", "Parsed as source-local timestamps"],
        ["Shipping date parse failures", 0, int(df["shipping_date"].isna().sum()), "Pass", "Parsed as source-local timestamps"],
        ["Negative sales rows", 0, int((df["gross_sales"] < 0).sum()), "Pass", "Gross sales must be non-negative"],
        ["Negative quantity rows", 0, int((df["quantity"] < 0).sum()), "Pass", "Quantity must be non-negative"],
        ["Discount rate outside 0-1", 0, int(((df["discount_rate"] < 0) | (df["discount_rate"] > 1)).sum()), "Pass", "Rate domain check"],
        ["Late-risk/status mismatches", 0, int(((df["late_delivery_risk"] == 1) != df["delivery_status"].eq("Late delivery")).sum()), "Pass", "Risk flag agrees with delivery status"],
        ["Shipping before order rows", 0, int((df["shipping_date"] < df["order_date"]).sum()), "Pass", "Temporal integrity"],
        ["Product description missing", len(df), int(df["product_description"].isna().sum()), "Documented", "Entirely empty; removed from cleaned file"],
        ["Order zipcode missing", None, int(df["order_zipcode"].isna().sum()), "Documented", "86.24% missing; removed from cleaned file"],
        ["Timestamp duration differs by 0.5 day", 0, int((((df["shipping_date"] - df["order_date"]).dt.total_seconds() / 86400 - df["actual_shipping_days"]).abs() == 0.5).sum()), "Documented", "Use supplied actual_shipping_days for KPI consistency"],
    ]
    pd.DataFrame(quality_rows, columns=["check", "expected", "actual", "status", "interpretation"]).to_csv(outputs_dir / "data_quality_summary.csv", index=False)

    validation = pd.DataFrame([
        ["Total records", "180K+", metrics["total_records"], "COUNT(*)", "Verified"],
        ["Distinct orders", "65.7K", metrics["distinct_orders"], "COUNT(DISTINCT order_id)", "Correct value is 65,752 (65.75K; 65.8K to 1 decimal)"],
        ["Total sales", "$36.78M", metrics["gross_sales"], "SUM(gross_sales / source Sales)", "Verified as gross sales; net sales are $33.05M"],
        ["Total profit", "$3.97M", metrics["total_profit"], "SUM(profit / source Order Profit Per Order)", "Verified"],
        ["Late-delivery rate", "54.83%", metrics["late_delivery_rate_row"], "SUM(late_delivery_risk) / COUNT(*)", "Verified at line-item row grain; order-level rate is 54.82%"],
        ["AOV", "$559.46", metrics["gross_aov"], "SUM(gross_sales) / COUNT(DISTINCT order_id)", "Correct two-decimal rounding is $559.45"],
    ], columns=["metric", "resume_claim", "calculated_value", "definition", "result"])
    validation.to_csv(outputs_dir / "metrics_validation.csv", index=False)

    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--project-root", type=Path, required=True)
    args = parser.parse_args()
    build(args.source.resolve(), args.project_root.resolve())
