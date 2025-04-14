import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductByUuid } from "@/utils/productService";
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
  const [cartMessage, setCartMessage] = useState(null);
  const { isAuthenticated } = useAuth();
  const { addItem, isItemPending } = useCart();
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
      } catch (err) {
        setError(
          err.message || "An error occurred while fetching product details"
        );
      } finally {
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
      await addItem(product.uuid, 1, {
        name: product.name,
        price: product.price,
        category_name: product.category_name,
        image: product.image || null,
      });

      setCartMessage({
        type: "success",
        text: `${product.name} added to cart successfully`,
      });
    } catch (error) {
      setCartMessage({
        type: "error",
        text: "Failed to add item to cart",
      });
    } finally {
      // Clear message after 3 seconds
      setTimeout(() => {
        setCartMessage(null);
      }, 3000);
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
          <Button
            onClick={() => navigate("/")}
            className="mt-2"
            variant="outline"
          >
            Back to Products
          </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-muted rounded-lg flex items-center justify-center p-8">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="max-w-full h-auto rounded-lg"
            />
          ) : (
            <ShoppingCart className="h-32 w-32 text-muted-foreground" />
          )}
        </div>

        <div>
          <div className="mb-4">
            <Badge variant="outline" className="mb-2">
              {product.category_name}
            </Badge>
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <div className="text-2xl font-semibold mt-2">
              ${parseFloat(product.price).toFixed(2)}
            </div>
          </div>

          <div className="prose prose-sm max-w-none mb-6">
            <p>{product.description}</p>
          </div>

          <Button
            className="w-full sm:w-auto"
            size="lg"
            onClick={handleAddToCart}
            disabled={!isAuthenticated || isItemPending(product.uuid)}
          >
            {!isAuthenticated
              ? "Sign in to Buy"
              : isItemPending(product.uuid)
              ? "Adding to Cart..."
              : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
