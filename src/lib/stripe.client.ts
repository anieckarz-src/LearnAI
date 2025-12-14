import { loadStripe, Stripe } from "@stripe/stripe-js";

// Client-side Stripe instance
// This is safe to use in browser/React components

let stripePromise: Promise<Stripe | null>;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.PUBLIC_STRIPE_PUBLIC_KEY;

    if (!key) {
      console.error("STRIPE_PUBLIC_KEY is not set in environment variables");
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(key);
  }

  return stripePromise;
}

// Helper function to redirect to Stripe Checkout
export async function redirectToCheckout(sessionId: string): Promise<void> {
  const stripe = await getStripe();

  if (!stripe) {
    throw new Error("Stripe failed to initialize");
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    throw new Error(error.message);
  }
}
