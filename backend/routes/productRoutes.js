import express from "express";
import * as productController from "../controllers/productController.js";
import * as imageController from "../controllers/productImageController.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";
import {
  validate,
  productSchema,
  productUuidParam,
  productImageSchema,
  productUuidParamForImage,
  imageUuidParam,
  imageUpdateSchema,
  searchProductsSchema,
  paginationSchema,
} from "../validations/index.js";

const router = express.Router();

// Public product routes (no authentication required)
router.get("/", validate(paginationSchema), productController.getProducts);
router.get(
  "/search",
  validate(searchProductsSchema),
  productController.searchProducts
);
router.get(
  "/:uuid",
  validate(productUuidParam),
  productController.getProductByUUID
);

// Protected routes (authentication required)
// Apply authentication middleware to all routes below this point
router.use(authenticate);

// Product modification routes - Admin only
router.post(
  "/",
  isAdmin,
  validate(productSchema),
  productController.addProduct
);
router.put(
  "/:uuid",
  isAdmin,
  validate([
    ...productUuidParam,
    ...productSchema.map((validation) => validation.optional()),
  ]),
  productController.updateProductByUUID
);
router.delete(
  "/:uuid",
  isAdmin,
  validate(productUuidParam),
  productController.removeProductByUUID
);

// Product image routes - Admin only for adding
router.get(
  "/images/:productUuid",
  validate(productUuidParamForImage),
  imageController.getProductImagesByUuid
);
router.post(
  "/images/:productUuid",
  isAdmin,
  validate([...productUuidParamForImage, ...productImageSchema]),
  imageController.addProductImage
);

// Image routes - Admin only
const imageRouter = express.Router();
imageRouter.put(
  "/:uuid",
  isAdmin,
  validate([...imageUuidParam, ...imageUpdateSchema]),
  imageController.updateProductImageByUuid
);
imageRouter.delete(
  "/:uuid",
  isAdmin,
  validate(imageUuidParam),
  imageController.deleteProductImageByUuid
);

// Mount the image router
router.use("/images", imageRouter);

export default router;
