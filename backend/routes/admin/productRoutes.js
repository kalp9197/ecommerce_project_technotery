import express from "express";
import { productController, imageController } from "../../controllers/admin/index.js";
import { authenticate } from "../../middlewares/auth.js";
import { isAdmin } from "../../middlewares/adminAuth.js";
import * as validation from "../../validations/index.js";

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Product management routes
router.post(
  "/",
  validation.validate(validation.productSchema),
  productController.addProduct
);

router.put(
  "/:uuid",
  validation.validate([
    ...validation.productUuidParam,
    ...validation.productSchema.map((val) => val.optional()),
  ]),
  productController.updateProductByUUID
);

router.delete(
  "/:uuid",
  validation.validate(validation.productUuidParam),
  productController.removeProductByUUID
);

// Product image management routes
router.post(
  "/images/:productUuid",
  validation.validate(validation.productUuidParamForImage),
  imageController.addProductImage
);

router.put(
  "/images/:uuid",
  validation.validate(validation.imageUuidParam),
  imageController.updateProductImage
);

router.delete(
  "/images/:uuid",
  validation.validate(validation.imageUuidParam),
  imageController.deleteProductImage
);

router.put(
  "/images/:uuid/featured",
  validation.validate(validation.imageUuidParam),
  imageController.setFeaturedImage
);

export default router;
