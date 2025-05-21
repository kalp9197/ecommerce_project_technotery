import express from "express";
import * as userAnalyticsController from "../controllers/userAnalyticsController.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";
import * as validation from "../validations/index.js";

const router = express.Router();

router.use(authenticate, isAdmin);
router.get(
  "/",
  validation.validate(validation.getUserAnalyticsSchema),
  userAnalyticsController.getUserAnalytics
);

export default router;
