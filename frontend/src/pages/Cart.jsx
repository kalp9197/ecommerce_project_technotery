import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/utils/authContext";
import { useCart } from "@/utils/cartContext";
import {
  Trash2,
  MinusCircle,
  PlusCircle,
  ArrowLeft,
  ShoppingBag,
  Edit,
  Save,
  X,
} from "lucide-react";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";

const Cart = () => {
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    cartCount,
    cartTotal,
    loading,
    error: contextError,
    isItemPending,
    updateItem,
    removeItem,
    clearCart,
    clearError,
    batchUpdateItems,
  } = useCart();
  const navigate = useNavigate();

  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/cart" } });
    }
  }, [isAuthenticated, navigate]);

  // Clear any errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleUpdateQuantity = async (
    itemUuid,
    currentQuantity,
    newQuantity
  ) => {
    if (newQuantity < 1) return;
    await updateItem(itemUuid, newQuantity, currentQuantity);
  };

  const handleRemoveItem = async (itemUuid) => {
    await removeItem(itemUuid);
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  // Initialize edit mode
  const handleEnterEditMode = () => {
    const initialQuantities = {};
    cartItems.forEach((item) => {
      initialQuantities[item.item_uuid] = item.quantity;
    });
    setEditedQuantities(initialQuantities);
    setIsEditMode(true);
    setHasChanges(false);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedQuantities({});
    setHasChanges(false);
  };

  // Handle quantity change in edit mode
  const handleQuantityChange = (itemUuid, value) => {
    const quantity = parseInt(value);
    if (isNaN(quantity) || quantity < 1) return;

    setEditedQuantities((prev) => ({
      ...prev,
      [itemUuid]: quantity,
    }));

    // Check if any quantity is different from original
    const originalQuantity =
      cartItems.find((item) => item.item_uuid === itemUuid)?.quantity || 0;
    if (quantity !== originalQuantity) {
      setHasChanges(true);
    } else {
      // Check if there are any other changes
      const anyChanges = cartItems.some((item) => {
        const editedQty = prev[item.item_uuid] || item.quantity;
        return editedQty !== item.quantity;
      });
      setHasChanges(anyChanges);
    }
  };

  // Save all edited quantities
  const handleSaveChanges = async () => {
    if (!hasChanges) {
      setIsEditMode(false);
      return;
    }

    const updatedItems = Object.entries(editedQuantities)
      .filter(([itemUuid, quantity]) => {
        const originalItem = cartItems.find(
          (item) => item.item_uuid === itemUuid
        );
        return originalItem && originalItem.quantity !== quantity;
      })
      .map(([item_uuid, quantity]) => ({
        item_uuid,
        quantity,
      }));

    if (updatedItems.length > 0) {
      await batchUpdateItems(updatedItems);
    }

    setIsEditMode(false);
    setEditedQuantities({});
    setHasChanges(false);
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

  if (contextError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>Error: {contextError}</p>
          <Button
            onClick={() => {
              clearError();
              window.location.reload();
            }}
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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Shopping Cart</h1>
        <div className="text-sm text-muted-foreground">
          {cartCount} {cartCount === 1 ? "item" : "items"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-md shadow-sm overflow-hidden border">
            <div className="divide-y">
              {cartItems.map((item, index) => (
                <div
                  key={item.item_uuid}
                  className={`p-4 flex items-center ${
                    item.isOptimistic ? "opacity-50" : ""
                  }`}
                >
                  <div className="w-8 text-center mr-2 text-muted-foreground font-medium">
                    {index + 1}
                  </div>
                  <div className="bg-muted rounded-md w-16 h-16 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ₹{parseFloat(item.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditMode ? (
                      <Input
                        type="number"
                        min="1"
                        value={
                          editedQuantities[item.item_uuid] || item.quantity
                        }
                        onChange={(e) =>
                          handleQuantityChange(item.item_uuid, e.target.value)
                        }
                        className="w-16 h-8 text-center"
                        disabled={isItemPending(item.item_uuid)}
                      />
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.item_uuid,
                              item.quantity,
                              item.quantity - 1
                            )
                          }
                          disabled={
                            isItemPending(item.item_uuid) || item.quantity <= 1
                          }
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
                            handleUpdateQuantity(
                              item.item_uuid,
                              item.quantity,
                              item.quantity + 1
                            )
                          }
                          disabled={isItemPending(item.item_uuid)}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="ml-4 text-right min-w-[100px]">
                    <div className="font-medium text-foreground">
                      ₹
                      {((parseFloat(item.price) || 0) * item.quantity).toFixed(
                        2
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 mt-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveItem(item.item_uuid)}
                      disabled={isItemPending(item.item_uuid)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={cartItems.some((item) =>
                    isItemPending(item.item_uuid)
                  )}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleSaveChanges}
                  disabled={
                    !hasChanges ||
                    cartItems.some((item) => isItemPending(item.item_uuid))
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleEnterEditMode}
                  disabled={cartItems.some((item) =>
                    isItemPending(item.item_uuid)
                  )}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={handleClearCart}
                  disabled={cartItems.some((item) =>
                    isItemPending(item.item_uuid)
                  )}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-md shadow-sm overflow-hidden p-6 border sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
                </span>
                <span className="font-medium">
                  ₹
                  {typeof cartTotal === "number"
                    ? cartTotal.toFixed(2)
                    : parseFloat(cartTotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">₹0.00</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold">
                  ₹
                  {typeof cartTotal === "number"
                    ? cartTotal.toFixed(2)
                    : parseFloat(cartTotal).toFixed(2)}
                </span>
              </div>

              <StripeCheckoutButton className="w-full mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
