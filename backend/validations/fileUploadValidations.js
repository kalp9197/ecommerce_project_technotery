import { body } from "express-validator";
import path from "path";

export const fileUploadSchema = [
  body().custom((value, { req }) => {
    // Check if req.files exists
    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error("No files were uploaded");
    }

    let csvFile = null;
    let zipFile = null;

    // Try to find CSV and ZIP files in the request
    if (!req.files.csv || !req.files.zip) {
      const fileKeys = Object.keys(req.files);

      for (const key of fileKeys) {
        if (Array.isArray(req.files[key])) {
          for (const file of req.files[key]) {
            if (file && file.name && file.name.toLowerCase().endsWith(".csv")) {
              csvFile = file;
            } else if (
              file &&
              file.name &&
              file.name.toLowerCase().endsWith(".zip")
            ) {
              zipFile = file;
            }
          }
        } else {
          const file = req.files[key];
          if (file && file.name && file.name.toLowerCase().endsWith(".csv")) {
            csvFile = file;
          } else if (
            file &&
            file.name &&
            file.name.toLowerCase().endsWith(".zip")
          ) {
            zipFile = file;
          }
        }
      }
    } else {
      csvFile = req.files.csv;
      zipFile = req.files.zip;
    }

    // Validate that both files exist
    if (!csvFile || !zipFile) {
      throw new Error("Both CSV and ZIP files are required");
    }

    // Validate that both files have names
    if (!csvFile.name) {
      throw new Error("CSV file must have a valid name");
    }

    if (!zipFile.name) {
      throw new Error("ZIP file must have a valid name");
    }

    // Compare base names
    const csvBaseName = path.parse(csvFile.name).name;
    const zipBaseName = path.parse(zipFile.name).name;

    if (csvBaseName !== zipBaseName) {
      throw new Error(
        `File base names must match: ${csvFile.name} vs ${zipFile.name}`
      );
    }

    return true;
  }),
];
