import express from "express";
import { fileUploadController } from "../../controllers/admin/index.js";
import { authenticate } from "../../middlewares/auth.js";
import { isAdmin } from "../../middlewares/adminAuth.js";
import * as validation from "../../validations/index.js";
import fileUpload from "express-fileupload";

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);
router.use(fileUpload());

// File upload routes
router.post(
  "/upload",
  validation.validate(validation.fileUploadSchema),
  fileUploadController.uploadFile
);

export default router;
