#!/usr/bin/env python3
"""Load the cleaned CSV into SQLite, run every analysis query, and save results."""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

import pandas as pd


def split_sql_statements(sql_text: str) -> list[str]:
    statements = []
    buffer = ""
    for line in sql_text.splitlines(keepends=True):
        buffer += line
        if sqlite3.complete_statement(buffer):
            statement = buffer.strip()
            if statement:
                statements.append(statement)
            buffer = ""
    if buffer.strip():
        raise ValueError("Incomplete SQL statement at end of file")
    return statements


def main(project_root: Path, database: Path) -> None:
    project_root = project_root.resolve()
    database = database.resolve()
    cleaned_csv = project_root / "data" / "processed" / "dataco_supply_chain_cleaned.csv"
    sql_dir = project_root / "sql"
    output_dir = project_root / "outputs" / "sql_results"
    output_dir.mkdir(parents=True, exist_ok=True)
    database.parent.mkdir(parents=True, exist_ok=True)
    if database.exists():
        database.unlink()

    conn = sqlite3.connect(database)
    try:
        conn.executescript((sql_dir / "00_create_schema.sql").read_text(encoding="utf-8"))
        for chunk in pd.read_csv(cleaned_csv, chunksize=25000):
            chunk.to_sql("supply_chain", conn, if_exists="append", index=False)
        conn.commit()

        manifest = []
        for sql_path in sorted(sql_dir.glob("*.sql")):
            if sql_path.name == "00_create_schema.sql":
                continue
            query_index = 0
            for statement in split_sql_statements(sql_path.read_text(encoding="utf-8")):
                cursor = conn.execute(statement)
                if cursor.description is None:
                    conn.commit()
                    continue
                query_index += 1
                columns = [d[0] for d in cursor.description]
                result = pd.DataFrame(cursor.fetchall(), columns=columns)
                result_path = output_dir / f"{sql_path.stem}_q{query_index:02d}.csv"
                result.to_csv(result_path, index=False)
                manifest.append({
                    "script": sql_path.name,
                    "query_number": query_index,
                    "result_file": str(result_path.relative_to(project_root)),
                    "rows": int(len(result)),
                    "columns": columns,
                })

        kpi_path = output_dir / "02_kpi_analysis_q01.csv"
        kpi = pd.read_csv(kpi_path).iloc[0].to_dict()
        expected = json.loads((project_root / "outputs" / "metrics_summary.json").read_text(encoding="utf-8"))
        checks = {
            "total_records": int(kpi["total_records"]) == expected["total_records"],
            "total_orders": int(kpi["total_orders"]) == expected["distinct_orders"],
            "total_sales": abs(float(kpi["total_sales"]) - expected["gross_sales"]) < 0.01,
            "total_profit": abs(float(kpi["total_profit"]) - expected["total_profit"]) < 0.01,
            "gross_aov": abs(float(kpi["gross_aov"]) - round(expected["gross_aov"], 2)) < 0.001,
            "late_delivery_rate": abs(float(kpi["late_delivery_rate_row_pct"]) - round(100 * expected["late_delivery_rate_row"], 2)) < 0.001,
        }
        validation = {
            "database": str(database.relative_to(project_root)),
            "loaded_rows": conn.execute("SELECT COUNT(*) FROM supply_chain").fetchone()[0],
            "query_result_files": manifest,
            "headline_reconciliation": checks,
            "all_headline_checks_pass": all(checks.values()),
        }
        (project_root / "outputs" / "sql_validation.json").write_text(
            json.dumps(validation, indent=2), encoding="utf-8"
        )
        if not all(checks.values()):
            raise AssertionError(f"SQL headline reconciliation failed: {checks}")
        print(json.dumps({"loaded_rows": validation["loaded_rows"], "queries": len(manifest), "headline_checks": checks}, indent=2))
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", type=Path, required=True)
    parser.add_argument("--database", type=Path, required=True)
    args = parser.parse_args()
    main(args.project_root, args.database)
