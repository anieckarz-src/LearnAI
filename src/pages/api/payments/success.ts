import type { APIRoute } from "astro";
import { stripe } from "@/lib/stripe.server";

export const GET: APIRoute = async ({ url, redirect }) => {
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return redirect("/courses?error=invalid_session");
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return redirect("/courses?error=payment_not_completed");
    }

    // Get course ID from metadata
    const courseId = session.metadata?.course_id;

    if (!courseId) {
      return redirect("/courses?error=invalid_course");
    }

    // Redirect to course page with success message
    return redirect(`/courses/${courseId}?payment=success`);
  } catch (error) {
    console.error("Error verifying payment:", error);
    return redirect("/courses?error=verification_failed");
  }
};
