import Sale from "../models/Sales.js";
import Inventory from "../models/Inventory.js";
import ProductionDemand from "../models/ProductionDemand.js";
import { allocateStock } from "./qcController.js";


export const createSale = async (req, res) => {
  try {
    const {
      customerName,
      companyName,
      email,
      phone,
      address,
      notes,
      items,
      paidAmount
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No items provided"
      });
    }

    let totalAmount = 0;
    let saleItems = [];
    let productionRequired = false;
    const createdDemands = [];
    const today = new Date();

    for (const item of items) {
      const requestedQty = Number(item.quantity);
      let remainingQty = requestedQty;
      let allocatedQty = 0;

      // Check unexpired Inventory (FIFO)
      const inventory = await Inventory.find({
        product: item.product,
        quantity: { $gt: 0 },
        expiryDate: { $gt: today }
      }).populate("batch").sort({ expiryDate: 1 });

      let batchAllocations = [];

      for (const stock of inventory) {
        if (remainingQty <= 0) break;

        const deduct = Math.min(
          remainingQty,
          stock.quantity
        );

        stock.quantity -= deduct;
        remainingQty -= deduct;
        allocatedQty += deduct;

        batchAllocations.push({
          batch: stock.batch?._id || stock.batch,
          quantity: deduct
        });

        await stock.save();
      }

      // Calculate total for requested quantity
      const price = Number(item.price);
      const discount = Number(item.discount || 0);
      const total = price * requestedQty * (1 - discount / 100);

      totalAmount += total;

      saleItems.push({
        product: item.product,
        quantity: requestedQty,
        allocatedQuantity: allocatedQty,
        remainingQuantity: remainingQty,
        batchAllocations,
        price,
        discount,
        total
      });

      // If out of stock or partially available, check existing demand or create
      if (remainingQty > 0) {
        productionRequired = true;

        const prodId = item.product;
        const existingDemand = await ProductionDemand.findOne({
          product: prodId,
          status: { $in: ["pending", "assigned"] }
        });

        if (existingDemand) {
          existingDemand.quantity += remainingQty;
          if (companyName && !existingDemand.companyName?.includes(companyName)) {
            existingDemand.companyName = `${existingDemand.companyName || ""}, ${companyName}`.replace(/^,\s*/, "");
          }
          await existingDemand.save();
          createdDemands.push(existingDemand);
        } else {
          const demand = await ProductionDemand.create({
            product: prodId,
            quantity: remainingQty,
            companyName: companyName || customerName,
            status: "pending",
            createdBy: req.user._id
          });
          createdDemands.push(demand);
        }
      }
    }

    let status = "approved";
    if (productionRequired) {
      const allZero = saleItems.every(i => (i.allocatedQuantity || 0) === 0);
      status = allZero ? "production-required" : "partial";
    }

    // Check duplicate submission in last 3 seconds
    const threeSecsAgo = new Date(Date.now() - 3000);
    const recentDuplicate = await Sale.findOne({
      customerName,
      totalAmount,
      createdBy: req.user._id,
      createdAt: { $gte: threeSecsAgo }
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: "Sale order already processed a moment ago.",
        sale: recentDuplicate,
        demands: createdDemands
      });
    }

    const sale = await Sale.create({
      customerName,
      companyName,
      email,
      phone,
      address,
      notes,
      items: saleItems,
      totalAmount,
      paidAmount: Number(paidAmount || 0),
      status,
      createdBy: req.user._id
    });

    const totalRemainingUnits = saleItems.reduce((acc, item) => acc + (item.remainingQuantity || 0), 0);
    const totalAllocatedUnits = saleItems.reduce((acc, item) => acc + (item.allocatedQuantity || 0), 0);

    res.status(201).json({
      success: true,
      message: productionRequired
        ? `Commercial Sale order created. Allocated ${totalAllocatedUnits.toLocaleString()} units from active stock. Scheduled ${totalRemainingUnits.toLocaleString()} units in Production Demand.`
        : `Commercial Sale order created. All ${totalAllocatedUnits.toLocaleString()} units allocated directly from warehouse batches.`,
      sale,
      demands: createdDemands
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// MANUALLY OR PROACTIVELY ALLOCATE AVAILABLE INVENTORY TO A SALES ORDER
export const allocateSaleOrder = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("items.product", "name price")
      .populate("items.batchAllocations.batch");

    if (!sale) {
      return res.status(404).json({ message: "Sales order not found" });
    }

    let newlyAllocatedTotal = 0;
    let anyDemandCreated = false;
    const today = new Date();

    for (const item of sale.items) {
      let remaining = item.remainingQuantity;
      if (remaining <= 0) continue;

      const prodId = item.product?._id || item.product;
      const inventory = await Inventory.find({
        product: prodId,
        quantity: { $gt: 0 },
        expiryDate: { $gt: today }
      }).populate("batch").sort({ expiryDate: 1 });

      for (const stock of inventory) {
        if (remaining <= 0) break;

        const deduct = Math.min(remaining, stock.quantity);
        stock.quantity -= deduct;
        remaining -= deduct;
        item.allocatedQuantity = (item.allocatedQuantity || 0) + deduct;
        newlyAllocatedTotal += deduct;

        item.batchAllocations.push({
          batch: stock.batch?._id || stock.batch,
          quantity: deduct
        });

        await stock.save();
      }

      item.remainingQuantity = remaining;

      // If still remaining and user wants to ensure demand exists
      if (remaining > 0 && req.body.createDemandIfEmpty) {
        const existingDemand = await ProductionDemand.findOne({
          product: prodId,
          status: { $in: ["pending", "assigned"] }
        });

        if (existingDemand) {
          existingDemand.quantity += remaining;
          await existingDemand.save();
        } else {
          await ProductionDemand.create({
            product: prodId,
            quantity: remaining,
            companyName: sale.companyName || sale.customerName,
            status: "pending",
            createdBy: req.user._id
          });
        }
        anyDemandCreated = true;
      }
    }

    const stillPending = sale.items.some(i => (i.remainingQuantity || 0) > 0);
    const someAllocated = sale.items.some(i => (i.allocatedQuantity || 0) > 0);

    if (!stillPending) {
      sale.status = "approved";
    } else if (someAllocated) {
      sale.status = "partial";
    } else {
      sale.status = "production-required";
    }

    await sale.save();

    res.json({
      success: true,
      message: newlyAllocatedTotal > 0
        ? `Successfully allocated ${newlyAllocatedTotal} units from inventory batches to customer.`
        : anyDemandCreated
        ? "No inventory available. Production Demand scheduled."
        : "No additional inventory stock currently available. Awaiting QC batch release.",
      newlyAllocatedTotal,
      sale
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//GET ALL SALES


export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("items.product", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      sales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSingleSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("items.product", "name price")
      .populate("createdBy", "name")
      .populate("items.batchAllocations.batch");

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateSaleStatus = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    sale.status = req.body.status || sale.status;

    await sale.save();

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Sale order not found" });
    }

    // Release allocated stock back to inventory
    for (const item of sale.items || []) {
      for (const alloc of item.batchAllocations || []) {
        if (alloc.batch && alloc.quantity > 0) {
          const batchId = alloc.batch?._id || alloc.batch;
          const inv = await Inventory.findOne({ batch: batchId });
          if (inv) {
            inv.quantity += alloc.quantity;
            await inv.save();
          }
        }
      }
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Sales order deleted successfully and allocated batch stock returned to warehouse inventory."
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const salesDashboard = async (req, res) => {
  try {
    const totalSales = await Sale.countDocuments();

    const revenue = await Sale.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const chart = await Sale.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          sales: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.json({
      stats: {
        totalSales,
        revenue: revenue[0]?.total || 0
      },
      chart
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const { amount, method, note } = req.body;

    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const payAmount = Number(amount);

    sale.payments.push({
      amount: payAmount,
      method,
      note
    });

    sale.paidAmount = Number(sale.paidAmount || 0) + payAmount;

    // IMPORTANT: DO NOT manually set dueAmount or status
    // schema will handle everything in pre-save

    await sale.save();

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const allocateStock = async (productId) => {

//   const sales = await Sale.find({
//     status: "production-required",
//     "items.product": productId
//   }).sort({ createdAt: 1 });

//   for (const sale of sales) {

//     let updated = false;

//     for (const item of sale.items) {

//       if (item.product.toString() !== productId) continue;

//       let remaining = item.remainingQuantity;

//       const inventory = await Inventory.find({
//         product: productId,
//         quantity: { $gt: 0 }
//       })
//       .populate("batch")
//       .sort({ expiryDate: 1 });

//       for (const stock of inventory) {

//         if (remaining <= 0) break;

//         const deduct = Math.min(
//           remaining,
//           stock.quantity
//         );

//         stock.quantity -= deduct;
//         remaining -= deduct;

//         item.allocatedQuantity += deduct;

//         //ADD THIS
//         item.batchAllocations.push({
//           batch: stock.batch,
//           quantity: deduct
//         });

//         await stock.save();
//         updated = true;
//       }

//       item.remainingQuantity = remaining;
//     }

//     const stillPending =
//       sale.items.some(
//         i => i.remainingQuantity > 0
//       );

//     if (stillPending) {
//       sale.status = "production-required";
//     } else {
//       sale.status = "completed";
//     }

//     if (updated) {
//       await sale.save();
//     }

//   }

// };