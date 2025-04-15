import React, { useEffect, useState } from "react";
import { getProducts, getCategories } from "@/utils/productService";
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
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [cartMessage, setCartMessage] = useState(null);
  const { isAuthenticated } = useAuth();
  const { addItem, isItemPending } = useCart();
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
      await addItem(product.uuid, 1, {
        name: product.name,
        price: product.price,
        category_name: product.category_name,
        image: product.image || null,
      });

      setCartMessage({
        type: "success",
        text: `${product.name} added to cart`,
      });
    } catch {
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
                        ${parseFloat(product.price).toFixed(2)}
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
                      disabled={!isAuthenticated || isItemPending(product.uuid)}
                    >
                      {!isAuthenticated
                        ? "Sign in to Buy"
                        : isItemPending(product.uuid)
                        ? "Adding..."
                        : "Add to Cart"}
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
