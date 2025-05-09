import express from "express";
import { paymentController } from "../../controllers/admin/index.js";
import { authenticate } from "../../middlewares/auth.js";
import { isAdmin } from "../../middlewares/adminAuth.js";
import * as validation from "../../validations/index.js";

const router = express.Router();

// Admin payment routes
router.use(authenticate);
router.use(isAdmin);

router.get(
  "/transactions",
  validation.validate(validation.paginationSchema),
  paymentController.getAllTransactions
);

export default router;
