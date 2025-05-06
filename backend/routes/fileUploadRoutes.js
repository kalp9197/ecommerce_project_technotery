import express from "express";
import { uploadFiles } from "../controllers/fileUploadController.js";
import fileUpload from "express-fileupload";
import { validate, fileUploadSchema } from "../validations/index.js";

const router = express.Router();

// Middleware for handling file uploads
router.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: "/tmp/",
    abortOnLimit: false,
    safeFileNames: false,
    preserveExtension: true,
  })
);

// Route for uploading files
router.post("/upload", validate(fileUploadSchema), uploadFiles);

export default router;
