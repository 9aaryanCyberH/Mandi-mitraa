import { Router } from "express";
import { PricesController } from "../controllers/prices.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  getPricesQuerySchema,
  comparePricesQuerySchema,
  historyPricesQuerySchema,
  analyticsQuerySchema
} from "../validators/price.validator.js";

const router = Router();

router.get("/ticker", PricesController.getTicker);
router.get("/pulse", PricesController.getPulse);
router.get("/", validate(getPricesQuerySchema, "query"), PricesController.getAll);
router.get("/analytics", validate(analyticsQuerySchema, "query"), PricesController.getAnalytics);
router.get("/history", validate(historyPricesQuerySchema, "query"), PricesController.getHistory);
router.get("/compare", validate(comparePricesQuerySchema, "query"), PricesController.comparePrices);

export default router;
