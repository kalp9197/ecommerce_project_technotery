import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/utils/paymentService";
import { useCart } from "@/utils/cartContext";
import { AlertCircle } from "lucide-react";

const StripeCheckoutButton = ({ className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { cartItems } = useCart();

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await createCheckoutSession(cartItems);
    } catch (_) {
      setError("Checkout failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleCheckout}
        disabled={isLoading || !cartItems.length}
        className={className}
      >
        {isLoading ? "Processing..." : "Checkout"}
      </Button>

      {error && (
        <div className="mt-2 text-sm text-red-500 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default StripeCheckoutButton;
