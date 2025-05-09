import { HTTP_STATUS } from "../../constants/index.js";
import { fileUploadModel } from "../../models/admin/index.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v4 as uuidv4 } from "uuid";
import AdmZip from "adm-zip";
import csv from "csv-parser";

// Setup directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(dirname(dirname(dirname(__dirname))), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload and process file
export const uploadFile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.files || !req.files.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const file = req.files.file;
    const fileExtension = path.extname(file.name).toLowerCase();
    const allowedExtensions = [".csv", ".zip"];

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid file type. Only CSV and ZIP files are allowed.",
      });
    }

    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    await file.mv(filePath);

    let result;
    if (fileExtension === ".csv") {
      result = await processCSVFile(filePath, userId);
    } else if (fileExtension === ".zip") {
      result = await processZIPFile(filePath, userId);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "File processed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to process file: ${error.message}`,
    });
  }
};

// Process CSV file
const processCSVFile = async (filePath, userId) => {
  return new Promise((resolve, reject) => {
    const products = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        products.push(data);
      })
      .on("end", async () => {
        try {
          const result = await fileUploadModel.bulkSaveProducts(products, userId);
          // Clean up file
          fs.unlinkSync(filePath);
          resolve(result);
        } catch (error) {
          // Clean up file
          fs.unlinkSync(filePath);
          reject(error);
        }
      })
      .on("error", (error) => {
        // Clean up file
        fs.unlinkSync(filePath);
        reject(error);
      });
  });
};

// Process ZIP file
const processZIPFile = async (filePath, userId) => {
  try {
    const zip = new AdmZip(filePath);
    const extractDir = path.join(uploadsDir, uuidv4());
    
    // Create extraction directory
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    // Extract ZIP file
    zip.extractAllTo(extractDir, true);
    
    // Find CSV file in extracted directory
    const files = fs.readdirSync(extractDir);
    const csvFile = files.find(file => path.extname(file).toLowerCase() === ".csv");
    
    if (!csvFile) {
      // Clean up
      fs.rmSync(extractDir, { recursive: true, force: true });
      fs.unlinkSync(filePath);
      throw new Error("No CSV file found in ZIP archive");
    }
    
    const csvFilePath = path.join(extractDir, csvFile);
    const result = await processCSVFile(csvFilePath, userId);
    
    // Clean up
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    // Clean up
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};
