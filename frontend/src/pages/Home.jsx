import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/utils/authContext";
import {
  ShoppingCart,
  Heart,
  Search,
  Star,
  ChevronRight,
  Tags,
  Package,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock e-commerce data
const featuredProducts = [
  {
    id: 1,
    name: "Premium Headphones",
    price: 149.99,
    image: "https://placehold.co/300x300/333/white?text=Headphones",
    rating: 4.8,
    discount: 15,
    category: "Electronics",
  },
  {
    id: 2,
    name: "Smart Watch Pro",
    price: 199.99,
    image: "https://placehold.co/300x300/333/white?text=Watch",
    rating: 4.6,
    discount: 0,
    category: "Electronics",
  },
  {
    id: 3,
    name: "Leather Wallet",
    price: 59.99,
    image: "https://placehold.co/300x300/333/white?text=Wallet",
    rating: 4.7,
    discount: 10,
    category: "Accessories",
  },
  {
    id: 4,
    name: "Designer Sunglasses",
    price: 89.99,
    image: "https://placehold.co/300x300/333/white?text=Sunglasses",
    rating: 4.5,
    discount: 0,
    category: "Accessories",
  },
];

const categories = [
  {
    id: 1,
    name: "Electronics",
    count: 243,
    icon: <Package className="w-4 h-4" />,
  },
  { id: 2, name: "Clothing", count: 156, icon: <Tags className="w-4 h-4" /> },
  {
    id: 3,
    name: "Home & Kitchen",
    count: 92,
    icon: <Package className="w-4 h-4" />,
  },
  {
    id: 4,
    name: "Beauty & Personal Care",
    count: 78,
    icon: <Package className="w-4 h-4" />,
  },
  {
    id: 5,
    name: "Sports & Outdoors",
    count: 65,
    icon: <Package className="w-4 h-4" />,
  },
  { id: 6, name: "Books", count: 112, icon: <Package className="w-4 h-4" /> },
];

export default function Home() {
  const { logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const addToCart = (productId) => {
    setCartCount((prevCount) => prevCount + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 p-8 mb-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Summer Sale</h1>
          <p className="text-lg mb-6">
            Get up to 50% off on selected items. Limited time offer!
          </p>
          <Button className="bg-white text-blue-600 hover:bg-gray-100">
            Shop Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Categories Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <span>{category.name}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline">{category.count}</Badge>
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full">
                View All Categories
              </Button>
            </CardFooter>
          </Card>

          {/* Shopping Cart */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Cart</CardTitle>
                <Badge>{cartCount}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {cartCount > 0 ? (
                <div className="space-y-4">
                  <p>You have {cartCount} item(s) in your cart</p>
                  <Button className="w-full">
                    <ShoppingCart className="mr-2 h-4 w-4" /> View Cart
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You are logged in and have access to all features.
              </p>
              <Button variant="destructive" className="w-full" onClick={logout}>
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Product Listings */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="pl-8 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Search products..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden h-full">
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  {product.discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-red-500">
                      {product.discount}% OFF
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur-sm"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    {product.category}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      {product.rating}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      {product.discount > 0 ? (
                        <>
                          <span className="font-bold">
                            $
                            {(
                              product.price *
                              (1 - product.discount / 100)
                            ).toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Button size="sm" onClick={() => addToCart(product.id)}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Button variant="outline">Load More Products</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
