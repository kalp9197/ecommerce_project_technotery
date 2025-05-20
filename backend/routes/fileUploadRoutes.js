import express from "express";
import { uploadFiles } from "../controllers/fileUploadController.js";
import fileUpload from "express-fileupload";
import * as validation from "../validations/index.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

router.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: "/tmp/",
    abortOnLimit: false,
    safeFileNames: false,
    preserveExtension: true,
  })
);

// Require authentication and admin role for file uploads
router.post(
  "/upload",
  authenticate,
  isAdmin,
  validation.validate(validation.fileUploadSchema),
  uploadFiles
);

export default router;
