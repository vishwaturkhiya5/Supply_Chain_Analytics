#!/usr/bin/env python3
"""Derive quantified portfolio insights from the processed DataCo data."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd


def row_dict(row: pd.Series, fields: list[str]) -> dict:
    out = {}
    for field in fields:
        value = row[field]
        if hasattr(value, "item"):
            value = value.item()
        out[field] = value
    return out


def main(project_root: Path) -> None:
    project_root = project_root.resolve()
    outputs = project_root / "outputs"
    data_path = project_root / "data" / "processed" / "dataco_supply_chain_cleaned.csv"
    metrics = json.loads((outputs / "metrics_summary.json").read_text(encoding="utf-8"))
    products = pd.read_csv(outputs / "product_performance.csv").sort_values("gross_sales", ascending=False)
    categories = pd.read_csv(outputs / "category_performance.csv").sort_values("gross_sales", ascending=False)
    markets = pd.read_csv(outputs / "market_performance.csv").sort_values("gross_sales", ascending=False)
    regions = pd.read_csv(outputs / "region_performance.csv")
    segments = pd.read_csv(outputs / "segment_performance.csv").sort_values("gross_sales", ascending=False)
    shipping = pd.read_csv(outputs / "shipping_mode_performance.csv").sort_values("late_delivery_rate_order", ascending=False)
    yearly = pd.read_csv(outputs / "yearly_performance.csv")
    monthly = pd.read_csv(outputs / "monthly_performance.csv")
    detail = pd.read_csv(
        data_path,
        usecols=["order_id", "gross_sales", "net_sales", "discount_amount", "profit", "order_year_month"],
    )
    order_profit = detail.groupby("order_id", as_index=False).agg(
        profit=("profit", "sum"), gross_sales=("gross_sales", "sum"), net_sales=("net_sales", "sum")
    )

    complete_years = yearly[yearly["period_note"].eq("Full year")].sort_values("order_year")
    first_year = complete_years.iloc[0]
    last_year = complete_years.iloc[-1]
    max_late_region = regions.loc[regions["late_delivery_rate_row"].idxmax()]
    min_late_region = regions.loc[regions["late_delivery_rate_row"].idxmin()]
    negative_lines = detail[detail["profit"] < 0]
    negative_orders = order_profit[order_profit["profit"] < 0]

    insights = {
        "sales_concentration": {
            "top_product": row_dict(products.iloc[0], ["product_id", "product_name", "category_name", "gross_sales", "profit"]),
            "top_product_sales_share": round(float(products.head(1)["gross_sales"].sum() / metrics["gross_sales"]), 8),
            "top_5_product_sales_share": round(float(products.head(5)["gross_sales"].sum() / metrics["gross_sales"]), 8),
            "top_10_product_sales_share": round(float(products.head(10)["gross_sales"].sum() / metrics["gross_sales"]), 8),
            "top_5_category_sales_share": round(float(categories.head(5)["gross_sales"].sum() / metrics["gross_sales"]), 8),
        },
        "shipping_efficiency": {
            "modes": [row_dict(r, ["shipping_mode", "orders", "late_delivery_rate_order", "avg_actual_shipping_days", "avg_scheduled_shipping_days", "avg_shipping_variance_days"]) for _, r in shipping.iterrows()],
            "standard_class_order_share": round(float(shipping.loc[shipping["shipping_mode"].eq("Standard Class"), "orders"].iloc[0] / metrics["distinct_orders"]), 8),
        },
        "customer_segments": {
            "largest_segment": row_dict(segments.iloc[0], ["customer_segment", "orders", "gross_sales", "profit", "late_delivery_rate_row"]),
            "largest_segment_sales_share": round(float(segments.iloc[0]["gross_sales"] / metrics["gross_sales"]), 8),
            "late_rate_range_percentage_points": round(float(100 * (segments["late_delivery_rate_row"].max() - segments["late_delivery_rate_row"].min())), 4),
        },
        "markets_and_regions": {
            "largest_market": row_dict(markets.iloc[0], ["market", "orders", "gross_sales", "profit", "late_delivery_rate_row"]),
            "largest_market_sales_share": round(float(markets.iloc[0]["gross_sales"] / metrics["gross_sales"]), 8),
            "highest_late_region": row_dict(max_late_region, ["order_region", "orders", "gross_sales", "late_delivery_rate_row"]),
            "lowest_late_region": row_dict(min_late_region, ["order_region", "orders", "gross_sales", "late_delivery_rate_row"]),
        },
        "profitability_risk": {
            "negative_profit_line_count": int(len(negative_lines)),
            "negative_profit_line_rate": round(float(len(negative_lines) / len(detail)), 8),
            "negative_profit_line_losses": round(float(negative_lines["profit"].sum()), 2),
            "negative_profit_line_gross_sales": round(float(negative_lines["gross_sales"].sum()), 2),
            "negative_profit_order_count": int(len(negative_orders)),
            "negative_profit_order_rate": round(float(len(negative_orders) / len(order_profit)), 8),
            "negative_profit_order_losses": round(float(negative_orders["profit"].sum()), 2),
            "negative_profit_order_gross_sales": round(float(negative_orders["gross_sales"].sum()), 2),
            "discount_share_of_gross_sales": round(float(detail["discount_amount"].sum() / detail["gross_sales"].sum()), 8),
        },
        "complete_year_trend": {
            "start_year": int(first_year["order_year"]),
            "end_year": int(last_year["order_year"]),
            "gross_sales_change": round(float(last_year["gross_sales"] / first_year["gross_sales"] - 1), 8),
            "profit_change": round(float(last_year["profit"] / first_year["profit"] - 1), 8),
            "order_change": round(float(last_year["orders"] / first_year["orders"] - 1), 8),
            "gross_aov_change": round(float(last_year["gross_aov"] / first_year["gross_aov"] - 1), 8),
            "lowest_complete_month": row_dict(monthly[monthly["order_year_month"] < "2018-01"].nsmallest(1, "gross_sales").iloc[0], ["order_year_month", "orders", "gross_sales", "profit", "gross_aov"]),
            "highest_complete_month": row_dict(monthly[monthly["order_year_month"] < "2018-01"].nlargest(1, "gross_sales").iloc[0], ["order_year_month", "orders", "gross_sales", "profit", "gross_aov"]),
            "partial_period_warning": "2018 contains January only and is excluded from annual growth comparisons.",
        },
    }
    (outputs / "insights_summary.json").write_text(json.dumps(insights, indent=2), encoding="utf-8")
    print(json.dumps(insights, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", type=Path, required=True)
    args = parser.parse_args()
    main(args.project_root)
