import express from "express";
import * as productController from "../controllers/productController.js";
import * as imageController from "../controllers/productImageController.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";
import * as validation from "../validations/index.js";

const router = express.Router();

// Public product routes (no authentication required)
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

// Protected routes (authentication required)
// Apply authentication middleware to all routes below this point
router.use(authenticate);

// Product modification routes - Admin only
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
    ...validation.productSchema.map((val) => val.optional()),
  ]),
  productController.updateProductByUUID
);
router.delete(
  "/:uuid",
  isAdmin,
  validation.validate(validation.productUuidParam),
  productController.removeProductByUUID
);

// Product image routes - Admin only for adding
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

// Image routes - Admin only
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

// Mount the image router
router.use("/images", imageRouter);

export default router;
