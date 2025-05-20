import express from "express";
import * as productController from "../controllers/productController.js";
import * as imageController from "../controllers/productImageController.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";
import * as validation from "../validations/index.js";

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
  "/recommendations/:uuid",
  validation.validate(validation.productUuidParam),
  productController.getRecommendedProducts
);
router.get(
  "/category/:uuid",
  validation.validate([
    ...validation.categoryUuidParamForProducts,
    ...validation.paginationSchema,
  ]),
  productController.getProductsByCategory
);

// Require authentication for all routes below
router.use(authenticate);

// Admin-only product management routes
router.post(
  "/",
  isAdmin,
  validation.validate(validation.productSchema),
  productController.addProduct
);
router.put(
  "/:uuid",
  isAdmin,
  validation.validate([
    ...validation.productUuidParam,
    ...validation.productSchema,
  ]),
  productController.updateProductByUUID
);
router.delete(
  "/:uuid",
  isAdmin,
  validation.validate(validation.productUuidParam),
  productController.removeProductByUUID
);

// Cache management route - admin only
router.post("/refresh-cache", isAdmin, productController.refreshCache);

// Product image routes
router.get(
  "/images/:productUuid",
  validation.validate(validation.productUuidParamForImage),
  imageController.getProductImagesByUuid
);
router.post(
  "/images/:productUuid",
  isAdmin,
  validation.validate([
    ...validation.productUuidParamForImage,
    ...validation.productImageSchema,
  ]),
  imageController.addProductImage
);

// Single image operations
const imageRouter = express.Router();
imageRouter.put(
  "/:uuid",
  isAdmin,
  validation.validate([
    ...validation.imageUuidParam,
    ...validation.imageUpdateSchema,
  ]),
  imageController.updateProductImageByUuid
);
imageRouter.delete(
  "/:uuid",
  isAdmin,
  validation.validate(validation.imageUuidParam),
  imageController.deleteProductImageByUuid
);

router.use("/images", imageRouter);

export default router;
