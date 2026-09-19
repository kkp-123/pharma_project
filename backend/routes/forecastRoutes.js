import express from 'express';
import { getNextMonthSalesForecast } from '../controllers/forecastController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Next-Month Predictive Sales & Product Demand Forecasting (Admin & Sales/Production Managers)
router.get('/sales-next-month', protect, authorize('admin', 'manager'), getNextMonthSalesForecast);

export default router;
