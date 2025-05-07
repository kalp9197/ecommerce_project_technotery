// Validation rules and constants
export const VALIDATION_RULES = {
  // User validation
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  
  // Product validation
  PRODUCT_NAME_MIN_LENGTH: 2,
  PRODUCT_NAME_MAX_LENGTH: 100,
  PRODUCT_PRICE_MIN: 0,
  
  // Cart validation
  CART_QUANTITY_MIN: 1,
  CART_QUANTITY_MAX: 100,
  
  // Review validation
  REVIEW_RATING_MIN: 0,
  REVIEW_RATING_MAX: 5,
  
  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};
