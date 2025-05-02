import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import csv from "csv-parser";
import { bulkSaveProducts } from "../models/fileUploadModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

export const uploadFiles = async (req, res) => {
  try {
    let csvFile, zipFile;

    // Identify CSV and ZIP files from the request
    for (const file of Object.values(req.files || {}).flat()) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".csv")) csvFile = file;
      if (name.endsWith(".zip")) zipFile = file;
    }

    if (!csvFile || !zipFile) {
      return res.status(400).json({
        success: false,
        message: "Both CSV and ZIP files are required",
      });
    }

    const baseCSV = path.parse(csvFile.name).name.toLowerCase();
    const baseZIP = path.parse(zipFile.name).name.toLowerCase();
    if (baseCSV !== baseZIP) {
      return res.status(400).json({
        success: false,
        message: "CSV and ZIP filenames must match",
      });
    }

    const timestamp = Date.now();
    const csvPath = path.join(uploadsDir, `${timestamp}_${csvFile.name}`);
    const zipPath = path.join(uploadsDir, `${timestamp}_${zipFile.name}`);
    await csvFile.mv(csvPath);
    await zipFile.mv(zipPath);

    // Parse CSV
    const products = await new Promise((resolve, reject) => {
      const result = [];
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (row) => {
          const lowerRow = Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k.toLowerCase(), v])
          );
          result.push(lowerRow);
        })
        .on("end", () => resolve(result))
        .on("error", reject);
    });

    // Extract ZIP
    const extractDir = path.join(uploadsDir, `${timestamp}_images`);
    await new Promise((resolve, reject) => {
      new AdmZip(zipPath).extractAllToAsync(extractDir, true, (err) =>
        err ? reject(err) : resolve()
      );
    });

    const entries = new AdmZip(zipPath).getEntries();

    const processedData = products.map((p) => {
      const sku = p.sku;
      const images = entries
        .filter((e) => !e.isDirectory && e.entryName.startsWith(`${sku}-`))
        .map((e) => {
          const src = path.join(extractDir, e.entryName);
          const filename = `${timestamp}_${path.basename(e.entryName)}`;
          const dest = path.join(uploadsDir, filename);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            return `/uploads/${filename}`;
          } else {
            console.warn("Missing:", src);
            return null;
          }
        })
        .filter(Boolean);

      return {
        product: {
          name: p.name || "",
          category: p.category || "",
          description: p.description || "",
          price: parseFloat(p.price || 0),
          quantity: parseInt(p.quantity || 0, 10),
        },
        images,
      };
    });

    const savedProducts = await bulkSaveProducts(processedData);
    const created = savedProducts.filter((p) => !p.isExisting).length;
    const updated = savedProducts.filter((p) => p.isExisting).length;

    return res.status(200).json({
      success: true,
      message: "Upload successful",
      stats: { total: savedProducts.length, created, updated },
      products: savedProducts,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};
