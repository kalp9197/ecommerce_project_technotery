import { dbService } from "../../services/index.js";
import { v4 as uuidv4 } from "uuid";

// Bulk save products from CSV data
export const bulkSaveProducts = async (products, userId) => {
  let connection;
  try {
    connection = await dbService.beginTransaction();
    
    const results = {
      total: products.length,
      success: 0,
      failed: 0,
      errors: [],
    };
    
    for (const product of products) {
      try {
        // Validate required fields
        if (!product.name || !product.price || !product.category) {
          throw new Error("Missing required fields: name, price, or category");
        }
        
        // Get or create category
        let categoryId;
        const existingCategories = await dbService.queryWithConnection(
          connection,
          `SELECT
              id
            FROM
              product_categories
            WHERE
              name = ? AND is_active = 1`,
          [product.category]
        );
        
        if (existingCategories?.length) {
          categoryId = existingCategories[0].id;
        } else {
          // Create new category
          const categoryUuid = uuidv4();
          const categoryResult = await dbService.queryWithConnection(
            connection,
            `INSERT INTO
                product_categories (uuid, name, description, created_by)
              VALUES
                (?, ?, ?, ?)`,
            [categoryUuid, product.category, product.category_description || "", userId]
          );
          
          if (!categoryResult?.affectedRows) {
            throw new Error("Failed to create category");
          }
          
          const newCategories = await dbService.queryWithConnection(
            connection,
            `SELECT
                id
              FROM
                product_categories
              WHERE
                uuid = ?`,
            [categoryUuid]
          );
          
          categoryId = newCategories[0].id;
        }
        
        // Create product
        const productUuid = uuidv4();
        const productResult = await dbService.queryWithConnection(
          connection,
          `INSERT INTO
              products (uuid, name, description, price, quantity, p_cat_id, created_by)
            VALUES
              (?, ?, ?, ?, ?, ?, ?)`,
          [
            productUuid,
            product.name,
            product.description || "",
            parseFloat(product.price),
            parseInt(product.quantity || 0),
            categoryId,
            userId,
          ]
        );
        
        if (!productResult?.affectedRows) {
          throw new Error("Failed to create product");
        }
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          product: product.name,
          error: error.message,
        });
      }
    }
    
    await dbService.commit(connection);
    return results;
  } catch (error) {
    if (connection) await dbService.rollback(connection);
    throw new Error(`Error processing bulk products: ${error.message}`);
  }
};
