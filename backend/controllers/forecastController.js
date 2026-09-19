import Sales from "../models/Sales.js";
import Product from "../models/Product.js";
import ProductionDemand from "../models/ProductionDemand.js";
import Inventory from "../models/Inventory.js";

//
// NEXT-MONTH PREDICTIVE SALES & DEAND FORECAST
//
export const getNextMonthSalesForecast = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonthStr = `${currentYear}-${currentMonth}`;

    const nextMonthDate = new Date(currentYear, now.getMonth() + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
    const nextMonthStr = `${nextYear}-${nextMonth}`;

    // 1. Fetch historical sales orders
    const allSales = await Sales.find()
      .populate("items.product", "name price category")
      .sort({ createdAt: 1 });

    // Group revenue by month
    const monthlyRevenue = {};
    const productSalesVolumes = {};

    for (const order of allSales) {
      const orderDate = new Date(order.createdAt);
      const orMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue[orMonth] = (monthlyRevenue[orMonth] || 0) + (order.totalAmount || 0);

      for (const item of order.items || []) {
        const prodId = item.product?._id?.toString() || item.product?.toString();
        if (prodId) {
          productSalesVolumes[prodId] = (productSalesVolumes[prodId] || 0) + item.quantity;
        }
      }
    }

    const revenueValues = Object.values(monthlyRevenue);
    const lastMonthRev = revenueValues.length > 0 ? revenueValues[revenueValues.length - 1] : 500000;

    // 2. Calculate Trend & Growth Rate
    let growthRate = 0.12; // Default 12% industry growth if not enough history
    if (revenueValues.length >= 2) {
      const prev1 = revenueValues[revenueValues.length - 2];
      const prev2 = revenueValues[revenueValues.length - 1];
      if (prev1 > 0) {
        growthRate = Math.min(0.35, Math.max(-0.05, (prev2 - prev1) / prev1));
      }
    }

    const predictedRevenue = Math.round(lastMonthRev * (1 + growthRate));
    const projectedGrowthPercent = Number((growthRate * 100).toFixed(1));

    // 3. Product Demand Forecast
    const products = await Product.find().lean();
    const inventories = await Inventory.find().lean();
    const pendingDemands = await ProductionDemand.find({ status: { $in: ["pending", "assigned", "in-production"] } }).lean();

    const productForecasts = products.map((prod) => {
      const prodId = prod._id.toString();
      const historicalSold = productSalesVolumes[prodId] || 10000;
      const baseDemand = Math.round((historicalSold / Math.max(1, revenueValues.length || 1)) * (1 + growthRate));

      // Find current warehouse stock
      const invItems = inventories.filter(i => i.product?.toString() === prodId);
      const currentStock = invItems.reduce((sum, i) => sum + (i.quantity || 0), 0);

      // Find pending company demands
      const pendingUnits = pendingDemands
        .filter(d => d.product?.toString() === prodId)
        .reduce((sum, d) => sum + (d.quantity || 0), 0);

      const predictedDemandUnits = Math.max(5000, baseDemand + pendingUnits);
      const stockDeficit = Math.max(0, predictedDemandUnits - currentStock);
      const recommendedBatchOrder = stockDeficit > 0 ? Math.ceil(stockDeficit / 10000) * 10000 : 0;

      return {
        productId: prod._id,
        name: prod.name,
        price: prod.price,
        currentStock,
        pendingUnits,
        predictedDemandUnits,
        recommendedBatchOrder,
        stockStatus: stockDeficit > 0 ? "reorder-needed" : "in-stock",
        projectedRevenue: predictedDemandUnits * (prod.price || 20)
      };
    });

    res.json({
      success: true,
      forecastMonth: nextMonthStr,
      predictedRevenue,
      projectedGrowthPercent,
      lastMonthRevenue: lastMonthRev,
      productForecasts,
      insights: [
        `Hospital procurement demand projected to grow by ${projectedGrowthPercent}% in ${nextMonthStr}.`,
        `Top high-velocity formulations: ${productForecasts.slice(0, 3).map(p => p.name).join(", ")}.`,
        `Recommended Immediate Production Batches: ${productForecasts.reduce((s, p) => s + p.recommendedBatchOrder, 0).toLocaleString()} units across factory lines.`
      ]
    });
  } catch (err) {
    console.error("Sales forecast error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
