import React from "react";
import { useEffect, useState } from "react";
import { getProducts, getCategories } from "@/utils/productService";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/utils/authContext";
import { useCart } from "@/utils/cartContext";
import WishlistButton from "@/components/WishlistButton";
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 8,
    hasMore: false,
  });

  const [activeTab, setActiveTab] = useState("all");
  const [cartMessage, setCartMessage] = useState(null);
  const { isAuthenticated } = useAuth();
  const { addItem, isItemPending, clearCart, refreshCart, cartItems } =
    useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasHandledPayment, setHasHandledPayment] = useState(false);

  // Handle payment success
  useEffect(() => {
    if (hasHandledPayment) return;

    const paymentSuccess = searchParams.get("payment_success");

    if (paymentSuccess === "true") {
      // Payment success detected
      setHasHandledPayment(true);

      // Clear cart both locally and on server
      clearCart();

      // Force refresh cart to ensure UI is updated
      setTimeout(() => {
        refreshCart();
      }, 500);

      // Show prominent success message
      setCartMessage({
        type: "success",
        text: "Payment completed successfully! Thank you for your purchase. Your items are on the way!",
      });

      // Remove URL parameters
      navigate("/", { replace: true });

      // Keep success message visible longer
      setTimeout(() => setCartMessage(null), 8000);
    }
  }, [searchParams, clearCart, hasHandledPayment, navigate, refreshCart]);

  // Fetch products and categories
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const productsResponse = await getProducts(page, pagination.limit);

      if (productsResponse.success) {
        setProducts(productsResponse.data);
        setPagination({
          currentPage: productsResponse.pagination.currentPage,
          limit: productsResponse.pagination.limit,
          hasMore: productsResponse.pagination.hasMore,
        });
      } else if (productsResponse.data && productsResponse.data.length > 0) {
        setProducts(productsResponse.data);
        setPagination(productsResponse.pagination);
      } else {
        setError("Failed to load products");
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || "An error occurred while fetching products");
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const categoriesResponse = await getCategories();

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      } else if (
        categoriesResponse.data &&
        categoriesResponse.data.length > 0
      ) {
        setCategories(categoriesResponse.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(1), fetchCategories()]);
      setLoading(false);
    };

    loadInitialData();
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    fetchProducts(newPage);
  };

  // Filter products by category
  const filteredProducts =
    activeTab === "all"
      ? products
      : products.filter((product) => product.category_name === activeTab);

  // Check if product is in cart
  const isProductInCart = (productUuid) => {
    return (
      cartItems &&
      cartItems.some(
        (item) =>
          item.product_id === productUuid || item.product_uuid === productUuid
      )
    );
  };

  // Handle add to cart click or view cart
  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/" } });
      return;
    }

    // If product is already in cart, navigate to cart page
    if (isProductInCart(product.uuid)) {
      navigate("/cart");
      return;
    }

    try {
      await addItem(product.uuid, 1, {
        name: product.name,
        price: product.price,
        category_name: product.category_name,
      });

    } catch (error) {
      // Check if the error is related to out-of-stock products
      const errorMessage = error.message || "";
      const isOutOfStock =
        errorMessage.toLowerCase().includes("out of stock") ||
        errorMessage.toLowerCase().includes("no products left") ||
        error.status === 400;

      setCartMessage({
        type: "error",
        text: isOutOfStock
          ? "This product is out of stock. No products left."
          : errorMessage || "Failed to add item to cart.",
      });
    } finally {
      // Always set a timeout to clear error messages after 10 seconds
      setTimeout(() => setCartMessage(null), 10000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>Error: {error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-2"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-4rem)]">
      <h1 className="text-3xl font-bold mb-6">Our Products</h1>

      {!isAuthenticated && (
        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-start gap-2">
          <ShoppingCart className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">Shopping Cart Access</p>
            <p className="text-amber-700 text-sm">
              Please{" "}
              <Link to="/login" className="underline">
                log in
              </Link>{" "}
              or{" "}
              <Link to="/register" className="underline">
                register
              </Link>{" "}
              to add items to your cart.
            </p>
          </div>
        </div>
      )}

      {cartMessage && (
        <div
          className={`mb-6 p-4 border rounded-md flex items-start gap-2 ${
            cartMessage.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          {cartMessage.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          )}
          <p
            className={
              cartMessage.type === "success" ? "text-green-800" : "text-red-800"
            }
          >
            {cartMessage.text}
          </p>
        </div>
      )}

      <Tabs
        defaultValue="all"
        className="flex-grow flex flex-col"
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="all">All Products</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.uuid} value={category.name}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0 flex-grow">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No products found in this category
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.uuid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Card className="overflow-hidden h-full">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">
                            {product.name}
                          </CardTitle>
                          <div className="mt-1 flex gap-1 flex-wrap">
                            <Badge variant="outline">
                              {product.category_name}
                            </Badge>
                            {product.is_featured && (
                              <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                              >
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-lg font-semibold">
                            ₹{parseFloat(product.price).toFixed(2)}
                          </div>
                          <WishlistButton
                            productUuid={product.uuid}
                            productDetails={{
                              name: product.name,
                              price: product.price,
                              category_name: product.category_name,
                              description: product.description,
                            }}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {product.description}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between mt-auto">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="scale-on-hover"
                      >
                        <Link to={`/products/${product.uuid}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={
                          !isAuthenticated || isItemPending(product.uuid)
                        }
                        className="btn-hover-effect"
                      >
                        {!isAuthenticated
                          ? "Sign in to Buy"
                          : isItemPending(product.uuid)
                          ? "Adding..."
                          : isProductInCart(product.uuid)
                          ? "View Cart"
                          : "Add to Cart"}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination Controls - Fixed at bottom */}
      <div className="mt-auto pt-8 pb-4 border-t">
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground px-2">
            Page {pagination.currentPage}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasMore || loading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Products;
