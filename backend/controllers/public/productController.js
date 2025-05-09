import { HTTP_STATUS } from "../../constants/index.js";
import { productModel } from "../../models/public/index.js";

// Get paginated product list
export const getProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid page or limit value",
      });
    }

    const offset = (page - 1) * limit;
    const result = await productModel.getAllProducts(limit, offset);

    if (!result.products?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "No products found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Products fetched successfully",
      data: result.products,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get products: ${error.message}`,
    });
  }
};

// Get product by UUID
export const getProductByUUID = async (req, res) => {
  try {
    const { uuid } = req.params;
    const product = await productModel.getProductByUuid(uuid);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get product: ${error.message}`,
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { query, category, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await productModel.searchProducts(
      query,
      category,
      parseInt(limit),
      offset
    );

    if (!result.products?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "No products found matching your search criteria",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Products found",
      data: result.products,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Search failed: ${error.message}`,
    });
  }
};

// Get product images
export const getProductImagesByUuid = async (req, res) => {
  try {
    const { productUuid } = req.params;

    const product = await productModel.getProductByUuid(productUuid);
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
    }

    const images = await productModel.getImagesByProductUuid(productUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get product images: ${error.message}`,
    });
  }
};
