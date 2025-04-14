import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductByUuid } from "@/utils/productService";
import { addToCart } from "@/utils/cartService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/utils/authContext";
import { useCart } from "@/utils/cartContext";
import { ShoppingCart, CheckCircle, XCircle } from "lucide-react";

const ProductDetail = () => {
  const { uuid } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductByUuid(uuid);

        if (response.success) {
          setProduct(response.data);
        } else {
          setError(response.message || "Failed to load product details");
        }

        setLoading(false);
      } catch (err) {
        setError(
          err.message || "An error occurred while fetching product details"
        );
        setLoading(false);
      }
    };

    if (uuid) {
      fetchProduct();
    }
  }, [uuid]);

  // Handle add to cart click
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate("/login", { state: { from: `/products/${uuid}` } });
      return;
    }

    try {
      setAddingToCart(true);
      // Send complete product information
      const response = await addToCart(product.uuid, 1, {
        name: product.name,
        price: product.price,
        category_name: product.category_name,
        image: product.image || null,
      });

      if (response.success) {
        // Refresh cart after adding item
        refreshCart();

        setCartMessage({
          type: "success",
          text: `${product.name} added to cart`,
        });
      } else {
        if (response.requiresAuth) {
          navigate("/login", { state: { from: `/products/${uuid}` } });
        } else {
          setCartMessage({
            type: "error",
            text: response.message,
          });
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setCartMessage({
        type: "error",
        text: "Failed to add item to cart",
      });
    } finally {
      setAddingToCart(false);
      // Clear message after 3 seconds
      setTimeout(() => {
        setCartMessage(null);
      }, 3000);
    }
  };

  // Handle wishlist click
  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/products/${uuid}` } });
    } else {
      console.log("Item added to wishlist");
      // Implement actual wishlist functionality
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>Error: {error || "Product not found"}</p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/">Back to Products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block mr-1 h-4 w-4"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to products
          </Link>
        </Button>
      </div>

      {!isAuthenticated && (
        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-start gap-2">
          <ShoppingCart className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">Shopping Cart Access</p>
            <p className="text-sm text-amber-700">
              To add this product to your cart, please sign in.{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-sm text-amber-800 font-medium underline"
                onClick={() =>
                  navigate("/login", { state: { from: `/products/${uuid}` } })
                }
              >
                Login now
              </Button>
            </p>
          </div>
        </div>
      )}

      {cartMessage && (
        <div
          className={`mb-6 p-4 rounded-md flex items-start gap-2 ${
            cartMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {cartMessage.type === "success" ? (
            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
          <p>{cartMessage.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-md bg-gray-100 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-2"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <p>No image available</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <Badge variant="outline" className="text-sm">
              {product.category_name}
            </Badge>
          </div>

          <div className="text-2xl font-bold mt-4">${product.price}</div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>

          <div className="mt-8 flex space-x-4">
            <Button
              className="w-full md:w-auto"
              onClick={handleAddToCart}
              disabled={addingToCart}
            >
              {isAuthenticated
                ? addingToCart
                  ? "Adding..."
                  : "Add to Cart"
                : "Sign in to Buy"}
            </Button>
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={handleAddToWishlist}
            >
              {isAuthenticated ? "Add to Wishlist" : "Save for Later"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
