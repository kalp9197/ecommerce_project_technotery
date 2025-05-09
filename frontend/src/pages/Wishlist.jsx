import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/utils/authContext";
import { useWishlist } from "@/utils/wishlistContext";
import { useCart } from "@/utils/cartContext";
import {
  Trash2,
  ArrowLeft,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import WishlistButton from "@/components/WishlistButton";

const Wishlist = () => {
  const { isAuthenticated } = useAuth();
  const {
    wishlistItems,
    wishlistCount,
    loading,
    error: wishlistError,
    clearWishlist,
    refreshWishlist,
  } = useWishlist();
  const { addItem: addToCart, isItemPending: isCartItemPending } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/wishlist" } });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const handleClearWishlist = async () => {
    await clearWishlist();
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/wishlist" } });
      return;
    }

    try {
      await addToCart(product.product_uuid, 1, {
        name: product.name,
        price: product.price,
        category_name: product.category_name,
        image: product.image || null,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading wishlist...</span>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to products
          </Link>
        </Button>

        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">
            Looks like you haven't added any products to your wishlist yet.
          </p>
          <Button asChild>
            <Link to="/">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to products
        </Link>
      </Button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Wishlist</h1>
        <div className="text-sm text-muted-foreground">
          {wishlistCount} {wishlistCount === 1 ? "item" : "items"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((item) => (
          <motion.div
            key={item.item_uuid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="group"
          >
            <div className="bg-card rounded-lg shadow-sm overflow-hidden border h-full flex flex-col">
              <div className="relative">
                <Link to={`/products/${item.product_uuid}`}>
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                </Link>
                <div className="absolute top-2 right-2">
                  <WishlistButton
                    productUuid={item.product_uuid}
                    itemUuid={item.item_uuid}
                  />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <Link to={`/products/${item.product_uuid}`}>
                  <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                </Link>
                <div className="text-sm text-muted-foreground mb-2">
                  {item.category_name}
                </div>
                <p className="text-sm line-clamp-2 mb-4 flex-1">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="font-bold">₹{parseFloat(item.price).toFixed(2)}</div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                    disabled={isCartItemPending(item.product_uuid)}
                  >
                    {isCartItemPending(item.product_uuid) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {wishlistItems.length > 0 && (
        <div className="mt-8 flex justify-end">
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleClearWishlist}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Wishlist
          </Button>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
