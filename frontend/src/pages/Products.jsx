import React, { useEffect, useState } from "react";
import { getProducts, getCategories } from "@/utils/productService";
import { addToCart } from "@/utils/cartService";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/utils/authContext";
import { useCart } from "@/utils/cartContext";
import { ShoppingCart, CheckCircle, XCircle } from "lucide-react";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);
  const [addedItem, setAddedItem] = useState(null);
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsResponse, categoriesResponse] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        if (productsResponse.success) {
          setProducts(productsResponse.data);
        } else if (productsResponse.data && productsResponse.data.length > 0) {
          setProducts(productsResponse.data);
        } else {
          setError("Failed to load products");
        }

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        } else if (
          categoriesResponse.data &&
          categoriesResponse.data.length > 0
        ) {
          setCategories(categoriesResponse.data);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message || "An error occurred while fetching data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products by category
  const filteredProducts =
    activeTab === "all"
      ? products
      : products.filter((product) => product.category_name === activeTab);

  // Handle add to cart click
  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate("/login", { state: { from: "/" } });
      return;
    }

    try {
      setAddingToCart(true);
      setAddedItem(product);

      // Pass complete product information when adding to cart
      const response = await addToCart(product.uuid, 1, {
        name: product.name,
        price: product.price,
        category_name: product.category_name,
        image: product.image || null,
      });

      if (response.success) {
        // Refresh the cart count after adding an item
        refreshCart();

        setCartMessage({
          type: "success",
          text: `${product.name} added to cart`,
        });
      } else {
        if (response.requiresAuth) {
          navigate("/login", { state: { from: "/" } });
        } else {
          setCartMessage({
            type: "error",
            text: response.message,
          });
        }
      }
    } catch {
      setCartMessage({
        type: "error",
        text: "Failed to add item to cart",
      });
    } finally {
      setAddingToCart(false);
      // Clear message after 3 seconds
      setTimeout(() => {
        setCartMessage(null);
        setAddedItem(null);
      }, 3000);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Products</h1>

      {!isAuthenticated && (
        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-md flex items-start gap-2">
          <ShoppingCart className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">Shopping Cart Access</p>
            <p className="text-sm text-amber-700">
              To add products to your cart, please sign in.{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-sm text-amber-800 font-medium underline"
                onClick={() =>
                  navigate("/login", { state: { from: "/products" } })
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

      <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="all">All Products</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.uuid} value={category.name}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No products found in this category
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.uuid} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          {product.name}
                        </CardTitle>
                        <div className="mt-1">
                          <Badge variant="outline">
                            {product.category_name}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-lg font-semibold">
                        ${product.price}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {product.description}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/products/${product.uuid}`}>View Details</Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={
                        addingToCart && addedItem?.uuid === product.uuid
                      }
                    >
                      {isAuthenticated
                        ? addingToCart && addedItem?.uuid === product.uuid
                          ? "Adding..."
                          : "Add to Cart"
                        : "Sign in to Buy"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Products;
