import express from "express";
import { uploadFiles } from "../controllers/fileUploadController.js";
import fileUpload from "express-fileupload";
import * as validation from "../validations/index.js";

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

router.post(
  "/upload",
  validation.validate(validation.fileUploadSchema),
  uploadFiles
);

export default router;
