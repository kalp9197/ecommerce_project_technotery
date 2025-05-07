import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import csv from "csv-parser";
import { bulkSaveProducts } from "../models/fileUploadModel.js";
import { HTTP_STATUS } from "../constants/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

//Upload and process CSV and ZIP files
export const uploadFiles = async (req, res) => {
  try {
    // Prepare files for processing
    // If files were not provided with the correct keys, find them in the request
    if (!req.files.csv || !req.files.zip) {
      const fileKeys = Object.keys(req.files);
      let csvFile = null;
      let zipFile = null;

      for (const key of fileKeys) {
        if (Array.isArray(req.files[key])) {
          for (const file of req.files[key]) {
            if (file.name.toLowerCase().endsWith(".csv")) {
              csvFile = file;
            } else if (file.name.toLowerCase().endsWith(".zip")) {
              zipFile = file;
            }
          }
        } else {
          const file = req.files[key];
          if (file.name.toLowerCase().endsWith(".csv")) {
            csvFile = file;
          } else if (file.name.toLowerCase().endsWith(".zip")) {
            zipFile = file;
          }
        }
      }

      // Set the files for processing
      if (csvFile && zipFile) {
        req.files.csv = csvFile;
        req.files.zip = zipFile;
      }
    }

    const csvFile = req.files.csv;
    const zipFile = req.files.zip;
    const csvBaseName = path.parse(csvFile.name).name;
    const zipBaseName = path.parse(zipFile.name).name;

    const timestamp = Date.now();
    const csvPath = path.join(uploadsDir, `${timestamp}_${csvFile.name}`);
    const zipPath = path.join(uploadsDir, `${timestamp}_${zipFile.name}`);

    await csvFile.mv(csvPath);
    await zipFile.mv(zipPath);

    const products = [];
    const processedData = [];

    const processCSV = new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (row) => {
          const normalizedRow = {};
          Object.keys(row).forEach((key) => {
            normalizedRow[key.toLowerCase()] = row[key];
          });
          products.push(normalizedRow);
        })
        .on("end", async () => {
          try {
            const zip = new AdmZip(zipPath);
            const zipEntries = zip.getEntries();

            const extractDir = path.join(uploadsDir, `${timestamp}_images`);
            if (!fs.existsSync(extractDir)) {
              fs.mkdirSync(extractDir, { recursive: true });
            }

            zip.extractAllTo(extractDir, true);

            for (const product of products) {
              const productSku = product.sku;

              if (!productSku) {
                continue;
              }

              const productImages = zipEntries
                .filter(
                  (entry) =>
                    !entry.isDirectory &&
                    entry.name.startsWith(`${productSku}-`)
                )
                .map((entry) => {
                  const oldPath = path.join(extractDir, entry.name);
                  const newFilename = `${timestamp}_${entry.name}`;
                  const newPath = path.join(uploadsDir, newFilename);

                  if (fs.existsSync(oldPath)) {
                    fs.copyFileSync(oldPath, newPath);
                  }

                  return `/uploads/${newFilename}`;
                });

              processedData.push({
                product: {
                  name: product.name || "",
                  category: product.category || "",
                  description: product.description || "",
                  price: parseFloat(product.price || 0),
                  quantity: parseInt(product.quantity || 0, 10),
                },
                images: productImages,
              });
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (error) => {
          reject(error);
        });
    });

    await processCSV;

    const savedProducts = await bulkSaveProducts(processedData);

    // Group products by new vs updated
    const newProducts = savedProducts.filter((p) => !p.isExisting);
    const updatedProducts = savedProducts.filter((p) => p.isExisting);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Resource created successfully",
      stats: {
        total: savedProducts.length,
        created: newProducts.length,
        updated: updatedProducts.length,
      },
      products: savedProducts,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
