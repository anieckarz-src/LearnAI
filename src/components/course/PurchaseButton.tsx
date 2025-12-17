import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

interface PurchaseButtonProps {
  courseId: string;
  isEnrolled: boolean;
}

export function PurchaseButton({ courseId, isEnrolled }: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id: courseId }),
      });

      const result = await response.json();

      if (!result.success) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
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
  if (isEnrolled) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <Check className="w-5 h-5" />
        <span className="font-semibold">Masz dostęp do tego kursu</span>
      </div>
    );
  }

  // Show enroll button
  return (
    <div className="space-y-2">
      <Button
        onClick={handleEnroll}
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
            Zapisz się na kurs
          </>
        )}
      </Button>
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
    </div>
  );
}
