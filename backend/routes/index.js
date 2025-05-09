// Main routes index - exports all route modules from user, admin, and public
// User routes
export { default as authRoutes } from "./user/authRoutes.js";
export { default as cartRoutes } from "./user/cartRoutes.js";
export { default as wishlistRoutes } from "./user/wishlistRoutes.js";
export { default as reviewRoutes } from "./user/reviewRoutes.js";

// Admin routes - import with explicit names to avoid conflicts
import adminUserRoutes from "./admin/userRoutes.js";
import adminProductRoutes from "./admin/productRoutes.js";
import adminCategoryRoutes from "./admin/categoryRoutes.js";
import adminFileUploadRoutes from "./admin/fileUploadRoutes.js";
import adminPaymentRoutes from "./admin/paymentRoutes.js";

// Public routes - import with explicit names to avoid conflicts
import productRoutes from "./public/productRoutes.js";
import categoryRoutes from "./public/categoryRoutes.js";
import emailTestRoutes from "./public/emailTestRoutes.js";

// Re-export all routes
export {
  // Admin routes
  adminUserRoutes as userRoutes,
  adminProductRoutes,
  adminCategoryRoutes,
  adminFileUploadRoutes as fileUploadRoutes,
  adminPaymentRoutes as paymentRoutes,

  // Public routes
  productRoutes,
  categoryRoutes,
  emailTestRoutes,
};
