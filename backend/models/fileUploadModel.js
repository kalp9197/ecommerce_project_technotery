import { v4 as uuidv4 } from "uuid";
import { dbService } from "../services/index.js";

// Helper function to use transaction connection or default query
const exec = (conn) =>
  conn
    ? (sql, params) => dbService.queryWithConnection(conn, sql, params)
    : (sql, params) => dbService.query(sql, params);

// Create category if it doesn't exist, otherwise return existing
export const findOrCreateCategory = async (name, conn = null) => {
  const run = exec(conn);
  // Check for existing category first
  const existing = await run(
    `SELECT
        id,
        uuid
      FROM
        product_categories
      WHERE
        name = ? AND is_active = 1`,
    [name]
  );
  if (existing.length) return existing[0];

  // Create new category if not found
  const uuid = uuidv4();
  const result = await run(
    `INSERT INTO
        product_categories (uuid, name, is_active)
      VALUES
        (?, ?, 1)`,
    [uuid, name]
  );
  return { id: result.insertId, uuid };
};

// Check if product with name already exists in category
export const findExistingProduct = async (name, catId, conn = null) =>
  (
    await exec(conn)(
      `SELECT
          id,
          uuid,
          quantity
        FROM
          products
        WHERE
          name = ? AND p_cat_id = ? AND is_active = 1`,
      [name, catId]
    )
  )[0] || null;

// Save product with associated images (new or update existing)
export const saveProductWithImages = async (data, images = [], conn = null) => {
  const run = exec(conn);
  // Get or create product category
  const category = await findOrCreateCategory(data.category, conn);
  const existing = await findExistingProduct(data.name, category.id, conn);

  let id,
    uuid = uuidv4(),
    isNew = false;

  if (existing) {
    // Update existing product quantity only
    id = existing.id;
    uuid = existing.uuid;
    const qty = parseInt(existing.quantity) + parseInt(data.quantity || 0);
    await run(
      `UPDATE
          products
        SET
          quantity = ?,
          updated_at = NOW()
        WHERE
          id = ?`,
      [qty, id]
    );
  } else {
    // Create new product record
    const result = await run(
      `INSERT INTO
          products (uuid, p_cat_id, name, description, price, quantity, is_active)
        VALUES
          (?, ?, ?, ?, ?, ?, 1)`,
      [
        uuid,
        category.id,
        data.name,
        data.description || "",
        data.price,
        data.quantity || 0,
      ]
    );
    id = result.insertId;
    isNew = true;
  }

  // Add images only for new products
  if (isNew && images.length) {
    for (let i = 0; i < images.length; i++) {
      await run(
        `INSERT INTO
            product_images (uuid, p_id, image_path, is_featured, is_active)
          VALUES
            (?, ?, ?, ?, 1)`,
        [uuidv4(), id, images[i], i === 0 ? 1 : 0]
      );
    }
  }

  // Get complete product data for response
  const [product] = await run(
    `SELECT
        *
      FROM
        products
      WHERE
        id = ?`, 
    [id]
  );
  const imgRows = await run(
    `SELECT
        image_path
      FROM
        product_images
      WHERE
        p_id = ? AND is_active = 1`,
    [id]
  );

  return {
    id,
    uuid,
    name: data.name,
    description: data.description || "",
    price: data.price,
    quantity: product.quantity,
    categoryId: category.id,
    categoryUuid: category.uuid,
    isExisting: !isNew,
    images: imgRows.map((img) => img.image_path),
  };
};

// Process multiple products with images in a single transaction
export const bulkSaveProducts = async (dataList) => {
  // Start single transaction for all products
  const conn = await dbService.beginTransaction();
  try {
    const results = [];
    for (const { product, images } of dataList) {
      // Skip invalid product data
      if (!product.name || !product.category || !product.price) continue;
      results.push(await saveProductWithImages(product, images, conn));
    }
    await dbService.commit(conn);
    return results;
  } catch (err) {
    // Rollback entire batch on any error
    await dbService.rollback(conn);
    throw err;
  }
};
