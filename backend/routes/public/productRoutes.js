import express from "express";
import { productController } from "../../controllers/public/index.js";
import * as validation from "../../validations/index.js";

const router = express.Router();

// Public product routes
router.get(
  "/",
  validation.validate(validation.paginationSchema),
  productController.getProducts
);

router.get(
  "/search",
  validation.validate(validation.searchProductsSchema),
  productController.searchProducts
);

router.get(
  "/:uuid",
  validation.validate(validation.productUuidParam),
  productController.getProductByUUID
);

router.get(
  "/images/:productUuid",
  validation.validate(validation.productUuidParamForImage),
  productController.getProductImagesByUuid
);

export default router;
