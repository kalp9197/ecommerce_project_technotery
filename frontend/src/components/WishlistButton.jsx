import React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/utils/wishlistContext";
import { useAuth } from "@/utils/authContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const WishlistButton = ({
  productUuid,
  itemUuid = null,
  productDetails = {},
  variant = "outline",
  size = "icon",
  showText = false,
  className = "",
}) => {
  const { isAuthenticated } = useAuth();
  const { addItem, removeItem, isInWishlist, isItemPending } = useWishlist();
  const navigate = useNavigate();

  const isInWishlistAlready = isInWishlist(productUuid);
  const isPending =
    isItemPending(productUuid) || (itemUuid && isItemPending(itemUuid));

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }

    if (isPending) return;

    if (isInWishlistAlready) {
      // If we have the itemUuid, use it directly
      if (itemUuid) {
        await removeItem(itemUuid, productUuid);
      } else {
        // Otherwise, let the removeItem function handle finding the item
        await removeItem(null, productUuid);
      }
    } else {
      await addItem(productUuid, productDetails);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "group",
        isInWishlistAlready &&
          "text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950",
        className
      )}
      onClick={handleWishlistClick}
      disabled={isPending}
      aria-label={
        isInWishlistAlready ? "Remove from wishlist" : "Add to wishlist"
      }
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          isInWishlistAlready && "fill-current",
          isPending && "animate-pulse"
        )}
      />
      {showText && (
        <span className="ml-2">
          {isPending
            ? "Processing..."
            : isInWishlistAlready
            ? "Remove from Wishlist"
            : "Add to Wishlist"}
        </span>
      )}
    </Button>
  );
};

export default WishlistButton;
