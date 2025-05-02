import { v4 as uuidv4 } from "uuid";
import {
  query,
  beginTransaction,
  queryWithConnection,
  commit,
  rollback,
} from "../utils/db.js";

const exec = (conn) =>
  conn
    ? (sql, params) => queryWithConnection(conn, sql, params)
    : (sql, params) => query(sql, params);

// Find or create category
export const findOrCreateCategory = async (name, conn = null) => {
  const run = exec(conn);
  const existing = await run(
    "SELECT id, uuid FROM product_categories WHERE name = ? AND is_active = 1",
    [name]
  );
  if (existing.length) return existing[0];

  const uuid = uuidv4();
  const result = await run(
    "INSERT INTO product_categories (uuid, name, is_active) VALUES (?, ?, 1)",
    [uuid, name]
  );
  return { id: result.insertId, uuid };
};

// Check if product already exists
export const findExistingProduct = async (name, catId, conn = null) =>
  (
    await exec(conn)(
      "SELECT id, uuid, quantity FROM products WHERE name = ? AND p_cat_id = ? AND is_active = 1",
      [name, catId]
    )
  )[0] || null;

// Save single product and its images
export const saveProductWithImages = async (data, images = [], conn = null) => {
  const run = exec(conn);
  const category = await findOrCreateCategory(data.category, conn);
  const existing = await findExistingProduct(data.name, category.id, conn);

  let id,
    uuid = uuidv4(),
    isNew = false;

  if (existing) {
    id = existing.id;
    uuid = existing.uuid;
    const qty = parseInt(existing.quantity) + parseInt(data.quantity || 0);
    await run(
      "UPDATE products SET quantity = ?, updated_at = NOW() WHERE id = ?",
      [qty, id]
    );
  } else {
    const result = await run(
      `INSERT INTO products (uuid, p_cat_id, name, description, price, quantity, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
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

  if (isNew && images.length) {
    for (let i = 0; i < images.length; i++) {
      await run(
        `INSERT INTO product_images (uuid, p_id, image_path, is_featured, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [uuidv4(), id, images[i], i === 0 ? 1 : 0]
      );
    }
  }

  const [product] = await run("SELECT * FROM products WHERE id = ?", [id]);
  const imgRows = await run(
    "SELECT image_path FROM product_images WHERE p_id = ? AND is_active = 1",
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

// Save in bulk with transaction
export const bulkSaveProducts = async (dataList) => {
  const conn = await beginTransaction();
  try {
    const results = [];
    for (const { product, images } of dataList) {
      if (!product.name || !product.category || !product.price) continue;
      results.push(await saveProductWithImages(product, images, conn));
    }
    await commit(conn);
    return results;
  } catch (err) {
    await rollback(conn);
    throw err;
  }
};
