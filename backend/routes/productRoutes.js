import express from "express";
import * as productController from "../controllers/productController.js";
import * as imageController from "../controllers/productImageController.js";
import { authenticate } from "../middlewares/auth.js";
import {validate,productSchema,productUuidParam,productImageSchema,productUuidParamForImage,imageUuidParam,} from "../middlewares/validator.js";
import { body } from "express-validator";

const router = express.Router();

router.use(authenticate);
router.get("/", productController.getProducts);
router.get("/:uuid",validate(productUuidParam),productController.getProductByUUID);

router.get("/images/:productUuid",validate(productUuidParamForImage),imageController.getProductImagesByUuid);

router.post("/", validate(productSchema), productController.addProduct);
router.put("/:uuid",validate([...productUuidParam, ...productSchema]),productController.updateProductByUUID
);
router.delete("/:uuid",validate(productUuidParam),productController.removeProductByUUID);

//  product image routes
router.post(
  "/images/:productUuid",
  validate([...productUuidParamForImage, ...productImageSchema]),
  imageController.addProductImageByUuid
);

// Image routes
const imageRouter = express.Router();
imageRouter.put(
  "/:uuid",
  validate([...imageUuidParam, body("is_featured").isBoolean()]),
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
