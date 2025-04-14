import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} from "@/utils/cartService";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/utils/authContext";
import { useCart } from "@/utils/cartContext";
import {
  Trash2,
  MinusCircle,
  PlusCircle,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  // Calculate total price
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }

    const fetchCart = async () => {
      try {
        setLoading(true);
        const response = await getCart();
        if (response.success) {
          setCartItems(response.data);
        } else {
          if (response.requiresAuth) {
            navigate("/login", { state: { from: "/cart" } });
          } else {
            setError(response.message || "Failed to load cart");
          }
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
        setError("An error occurred while loading your cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated, navigate]);

  const handleRemoveItem = async (itemId) => {
    try {
      setUpdating(true);
      const response = await removeFromCart(itemId);
      if (response.success) {
        setCartItems(cartItems.filter((item) => item.id !== itemId));
        // Refresh cart counter after removing item
        refreshCart();
      } else {
        setError(response.message || "Failed to remove item");
      }
    } catch (err) {
      console.error("Error removing item:", err);
      setError("An error occurred while removing the item");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdating(true);
      const response = await updateCartItem(itemId, newQuantity);
      if (response.success) {
        setCartItems(
          cartItems.map((item) =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          )
        );
        // Refresh cart counter after updating quantity
        refreshCart();
      } else {
        setError(response.message || "Failed to update quantity");
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("An error occurred while updating the quantity");
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCart = async () => {
    try {
      setUpdating(true);
      const response = await clearCart();
      if (response.success) {
        setCartItems([]);
        // Refresh cart counter after clearing cart
        refreshCart();
      } else {
        setError(response.message || "Failed to clear cart");
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
      setError("An error occurred while clearing your cart");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading your cart...</p>
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

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to products
          </Link>
        </Button>

        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">
            Looks like you haven't added any products to your cart yet.
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

      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-md shadow-sm overflow-hidden border">
            <div className="divide-y">
              {cartItems.map((item, index) => (
                <div key={item.id} className="p-4 flex items-center">
                  <div className="w-8 text-center mr-2 text-muted-foreground font-medium">
                    {index + 1}
                  </div>
                  <div className="bg-muted rounded-md w-16 h-16 flex items-center justify-center shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${item.price}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity - 1)
                      }
                      disabled={updating || item.quantity <= 1}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center text-foreground">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={updating}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="ml-4 text-right min-w-[80px]">
                    <div className="font-medium text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              className="text-destructive"
              onClick={handleClearCart}
              disabled={updating || cartItems.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-md shadow-sm overflow-hidden p-4 border">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold">${totalPrice.toFixed(2)}</span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleClearCart}
                disabled={updating}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
