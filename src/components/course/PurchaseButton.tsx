import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Check } from "lucide-react";

interface PurchaseButtonProps {
  courseId: string;
  price: number | null;
  isEnrolled: boolean;
  hasAccess: boolean;
}

export function PurchaseButton({ courseId, price, isEnrolled, hasAccess }: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id: courseId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nie udało się utworzyć sesji płatności");
      }

      // Redirect to Stripe Checkout
      window.location.href = result.data.url;
    } catch (err) {
      console.error("Purchase error:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd. Spróbuj ponownie.");
      setLoading(false);
    }
  };

  const handleEnrollFree = async () => {
    setLoading(true);
    setError(null);

    try {
      // For free courses, create enrollment directly
      const response = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id: courseId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nie udało się zapisać na kurs");
      }

      // Reload page to show updated access
      window.location.reload();
    } catch (err) {
      console.error("Enrollment error:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd. Spróbuj ponownie.");
      setLoading(false);
    }
  };

  // If user already has access, show enrolled state
  if (hasAccess || isEnrolled) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <Check className="w-5 h-5" />
        <span className="font-semibold">Masz dostęp do tego kursu</span>
      </div>
    );
  }

  // Free course - show enroll button
  if (!price || price <= 0) {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleEnrollFree}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Zapisz się na kurs (Darmowy)
            </>
          )}
        </Button>
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      </div>
    );
  }

  // Paid course - show purchase button
  return (
    <div className="space-y-2">
      <Button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6 text-lg shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Przekierowanie do płatności...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Kup teraz za {price.toFixed(2)} PLN
          </>
        )}
      </Button>
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <p className="text-xs text-gray-500 text-center">
        Bezpieczna płatność przez Stripe
      </p>
    </div>
  );
}
