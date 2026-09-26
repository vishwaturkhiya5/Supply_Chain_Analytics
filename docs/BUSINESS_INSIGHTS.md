# Business Insights and Recommendations

## 1. Shipping Efficiency

| Shipping mode | Orders | Late-order rate | Actual days | Scheduled days | Average variance |
|---|---:|---:|---:|---:|---:|
| First Class | 10,079 | 95.27% | 2.00 | 1.00 | +1.00 |
| Second Class | 12,778 | 76.72% | 4.00 | 2.00 | +2.00 |
| Same Day | 3,571 | 46.15% | 0.48 | 0.00 | +0.48 |
| Standard Class | 39,324 | 38.13% | 4.00 | 4.00 | 0.00 |

First and Second Class have the largest mismatch between promised and actual delivery time. Standard Class covers 59.81% of orders and is aligned with its four-day schedule on average.

Recommendation: reset express-mode promises to observed performance, analyze carriers within those modes, and measure SLA improvement using one record per order.

## 2. Customer Segments

Consumer customers contribute **$19.10M**, or **51.91%**, of gross sales. Corporate contributes 30.36%, and Home Office contributes 17.73%.

Late-delivery rates are 54.81% for Consumer, 54.72% for Corporate, and 55.07% for Home Office. The entire range is only **0.35 percentage points**.

Recommendation: do not build separate delivery policies by customer segment. The evidence points to shipping mode and execution as the stronger levers.

## 3. Market and Regional Performance

Europe is the largest market with **$10.87M** in gross sales and **$1.17M** in profit, representing **29.56%** of total gross sales. LATAM follows at $10.28M.

Western Europe is the largest order region with **$5.89M** in gross sales. Its 55.85% row-level late rate is above the portfolio average and makes it a higher-value service-improvement target than smaller extreme-rate regions.

Central Africa has the highest regional late rate at 57.96%, but only 556 orders and $0.33M in gross sales. Canada has the lowest at 48.80%, with only 309 orders. These small bases should not drive global policy.

Recommendation: prioritize operational improvements using both rate and commercial scale. Western Europe is a more addressable first target than a small region selected only for its extreme rate.

## 4. Product Concentration

The Field & Stream Sportsman 16 Gun Fire Safe is the largest product, generating **$6.93M** in gross sales and **$0.76M** in profit. It alone contributes **18.84%** of gross sales.

- Top five products: 60.58% of gross sales
- Top ten products: 89.98% of gross sales
- Top five categories: 60.68% of gross sales

Recommendation: protect supplier capacity, inventory availability, and replenishment for the top ten products. Track concentration risk and develop alternatives before supplier or inventory disruptions occur.

## 5. Profitability Risk

Discounts total **$3.73M**, equal to **10.14%** of gross sales. Overall profit is $3.97M on $33.05M of net sales, a 12.00% net-sales profit margin.

At line-item grain, 33,784 records, or 18.71%, have negative profit and collectively lose $3.88M. At order grain, **13,908 orders, or 21.15%, are loss-making**. These orders generated **$8.09M** in gross sales but lost **$2.62M**.

Recommendation: introduce minimum-margin rules by product and order, review discount combinations, and flag loss-making orders for fulfillment-cost and pricing review.

## 6. Demand and Value Trend

Across complete years 2015 to 2017:

- Distinct orders increased 4.60%.
- Gross sales decreased 4.31%.
- Profit decreased 1.12%.
- Gross AOV decreased 8.52%.

September 2017 was the highest-sales complete month at **$1.14M** and a $663.83 gross AOV. December 2017 had **2,124 orders** but only **$0.50M** in gross sales and a $237.25 gross AOV, indicating a major product/value mix shift rather than a collapse in order volume.

Recommendation: separate order demand from order value. Monitor units, orders, AOV, category mix, gross sales, discounts, and profit together. Do not compare the January-only 2018 period against complete years.

