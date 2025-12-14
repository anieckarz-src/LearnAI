import Stripe from "stripe";

// Server-side Stripe client
// This should ONLY be used in server-side code (API routes, server actions)
// NEVER import this in client-side React components

if (!import.meta.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// Helper function to format amount for Stripe (convert to smallest currency unit)
export function formatAmountForStripe(amount: number, currency: string = "pln"): number {
  // Stripe requires amounts in the smallest currency unit (e.g., cents for USD, grosze for PLN)
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (convert from smallest currency unit)
export function formatAmountFromStripe(amount: number, currency: string = "pln"): number {
  return amount / 100;
}

// Helper function to create or update a product in Stripe
export async function createOrUpdateStripeProduct(courseId: string, title: string, description: string | null) {
  const product = await stripe.products.create({
    name: title,
    description: description || undefined,
    metadata: {
      course_id: courseId,
    },
  });

  return product;
}

// Helper function to create a price in Stripe
export async function createStripePrice(productId: string, amount: number, currency: string = "pln") {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: formatAmountForStripe(amount, currency),
    currency: currency.toLowerCase(),
  });

  return price;
}

// Helper function to create a checkout session
export async function createCheckoutSession({
  priceId,
  courseId,
  userId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  courseId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "blik"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      course_id: courseId,
      user_id: userId,
    },
  });

  return session;
}

// Helper function to verify webhook signature
export function verifyWebhookSignature(payload: string, signature: string, secret: string): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
