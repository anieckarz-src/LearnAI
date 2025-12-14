import type { APIRoute } from "astro";
import Stripe from "stripe";
import { verifyWebhookSignature } from "@/lib/stripe.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { generateStrongPassword } from "@/lib/user-helpers";

// Create Supabase admin client for webhook operations
const supabaseAdmin = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_KEY
);

export const POST: APIRoute = async ({ request }) => {
  // Get the raw body as text for signature verification
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = verifyWebhookSignature(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Processing checkout.session.completed:", session.id);

  const courseId = session.metadata?.course_id;
  const userId = session.metadata?.user_id;
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;

  if (!courseId || !userId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  if (!customerEmail) {
    console.error("Missing customer email in checkout session:", session.id);
    return;
  }

  // Check if user already exists in auth.users
  const { data: existingAuthUser } = await supabaseAdmin.auth.admin.getUserById(userId);

  let finalUserId = userId;

  if (!existingAuthUser?.user) {
    console.log(`User ${userId} not found in auth.users, creating new account...`);

    try {
      // Generate a strong random password
      const generatedPassword = generateStrongPassword(16);

      // Create user in Supabase Auth
      const { data: newAuthUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: generatedPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: customerName || null,
        },
      });

      if (createUserError) {
        console.error("Error creating auth user:", createUserError);
        // If user creation fails, we still want to update payment but not create enrollment
        await supabaseAdmin
          .from("payments")
          .update({
            status: "succeeded",
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq("stripe_checkout_session_id", session.id);
        return;
      }

      if (newAuthUser?.user) {
        finalUserId = newAuthUser.user.id;
        console.log(`Created new auth user: ${finalUserId}`);

        // Create user record in public.users table
        const { error: publicUserError } = await supabaseAdmin.from("users").insert({
          id: finalUserId,
          email: customerEmail,
          full_name: customerName || null,
          role: "user",
          is_blocked: false,
        });

        if (publicUserError) {
          console.error("Error creating public user record:", publicUserError);
        }

        // Send password reset email so user can set their own password
        const appUrl = import.meta.env.PUBLIC_APP_URL || "http://localhost:4321";
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(customerEmail, {
          redirectTo: `${appUrl}/reset-password`,
        });

        if (resetError) {
          console.error("Error sending password reset email:", resetError);
        } else {
          console.log(`Sent password reset email to ${customerEmail}`);
        }
      }
    } catch (error) {
      console.error("Error in user creation process:", error);
      // Continue with payment update even if user creation fails
    }
  } else {
    console.log(`User ${userId} already exists in auth.users`);

    // Make sure user exists in public.users table
    const { data: publicUser } = await supabaseAdmin.from("users").select("id").eq("id", userId).single();

    if (!publicUser) {
      console.log("Creating public user record for existing auth user...");
      const { error: publicUserError } = await supabaseAdmin.from("users").insert({
        id: userId,
        email: customerEmail,
        full_name: customerName || null,
        role: "user",
        is_blocked: false,
      });

      if (publicUserError) {
        console.error("Error creating public user record:", publicUserError);
      }
    }
  }

  // Update payment status
  const { error: paymentError } = await supabaseAdmin
    .from("payments")
    .update({
      status: "succeeded",
      stripe_payment_intent_id: session.payment_intent as string,
      paid_at: new Date().toISOString(),
    })
    .eq("stripe_checkout_session_id", session.id);

  if (paymentError) {
    console.error("Error updating payment:", paymentError);
  }

  // Create enrollment (if not already exists)
  const { error: enrollmentError } = await supabaseAdmin
    .from("course_enrollments")
    .insert({
      course_id: courseId,
      user_id: finalUserId,
    })
    .select()
    .single();

  // Check if error is a duplicate (which is OK)
  if (enrollmentError && !enrollmentError.message.includes("duplicate")) {
    console.error("Error creating enrollment:", enrollmentError);
  } else {
    console.log(`Successfully enrolled user ${finalUserId} in course ${courseId}`);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("Processing payment_intent.succeeded:", paymentIntent.id);

  // Update payment status if not already updated
  const { error } = await supabaseAdmin
    .from("payments")
    .update({
      status: "succeeded",
      stripe_payment_intent_id: paymentIntent.id,
      paid_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error && !error.message.includes("0 rows")) {
    console.error("Error updating payment on succeeded:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("Processing payment_intent.payment_failed:", paymentIntent.id);

  // Update payment status to failed
  const { error } = await supabaseAdmin
    .from("payments")
    .update({
      status: "failed",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error && !error.message.includes("0 rows")) {
    console.error("Error updating payment on failed:", error);
  }
}
