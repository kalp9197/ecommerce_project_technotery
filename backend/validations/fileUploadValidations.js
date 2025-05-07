import { body } from "express-validator";
import path from "path";

export const fileUploadSchema = [
  body().custom((value, { req }) => {
    if (!req.files) {
      throw new Error("No files were uploaded");
    }

    if (!req.files.csv && !req.files.zip) {
      const fileKeys = Object.keys(req.files);
      let csvFound = false;
      let zipFound = false;

      for (const key of fileKeys) {
        if (Array.isArray(req.files[key])) {
          for (const file of req.files[key]) {
            if (file.name.toLowerCase().endsWith(".csv")) csvFound = true;
            if (file.name.toLowerCase().endsWith(".zip")) zipFound = true;
          }
        } else {
          const file = req.files[key];
          if (file.name.toLowerCase().endsWith(".csv")) csvFound = true;
          if (file.name.toLowerCase().endsWith(".zip")) zipFound = true;
        }
      }

      if (!csvFound || !zipFound) {
        throw new Error("Both CSV and ZIP files are required");
      }
    } else {
      if (!req.files.csv || !req.files.zip) {
        throw new Error("Both CSV and ZIP files are required");
      }
    }

    const csvFile = req.files.csv;
    const zipFile = req.files.zip;
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
