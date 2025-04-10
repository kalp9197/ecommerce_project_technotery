import express from "express";
import * as productController from "../controllers/productController.js";
import * as imageController from "../controllers/productImageController.js";
import { authenticate } from "../middlewares/auth.js";
import {validate,productSchema,productUuidParam,productImageSchema,productUuidParamForImage,imageUuidParam,imageUpdateSchema,} from "../middlewares/validator.js";

const router = express.Router();

router.use(authenticate);

// Main product routes
router.get("/", productController.getProducts);
router.post("/", validate(productSchema), productController.addProduct);
router.put(
  "/:uuid",
  validate([
    ...productUuidParam,
    ...productSchema.map((validation) => validation.optional()),
  ]),
  productController.updateProductByUUID
);
router.delete(
  "/:uuid",
  validate(productUuidParam),
  productController.removeProductByUUID
);
// Product image routes
router.get(
  "/images/:productUuid",
  validate(productUuidParamForImage),
  imageController.getProductImagesByUuid
);
router.post(
  "/images/:productUuid",
  validate([...productUuidParamForImage, ...productImageSchema]),
  imageController.addProductImage
);

// Product by UUID route
router.get(
  "/:uuid",
  validate(productUuidParam),
  productController.getProductByUUID
);

// Image routes
const imageRouter = express.Router();
imageRouter.put(
  "/:uuid",
  validate([...imageUuidParam, ...imageUpdateSchema]),
  imageController.updateProductImageByUuid
);
imageRouter.delete(
  "/:uuid",
  validate(imageUuidParam),
  imageController.deleteProductImageByUuid
);

// Mount the image router
router.use("/images", imageRouter);

export default router;
