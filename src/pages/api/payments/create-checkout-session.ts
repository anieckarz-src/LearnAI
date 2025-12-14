import type { APIRoute } from "astro";
import { createCheckoutSession } from "@/lib/stripe.server";

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  // Check if user is authenticated
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Musisz być zalogowany, aby kupić kurs" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { course_id } = body;

    if (!course_id) {
      return new Response(JSON.stringify({ success: false, error: "Brak ID kursu" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, description, price, stripe_price_id, status")
      .eq("id", course_id)
      .single();

    if (courseError || !course) {
      return new Response(JSON.stringify({ success: false, error: "Kurs nie został znaleziony" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if course is published
    if (course.status !== "published") {
      return new Response(JSON.stringify({ success: false, error: "Ten kurs nie jest jeszcze dostępny" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if course is free
    if (!course.price || course.price <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Ten kurs jest darmowy. Nie wymaga płatności." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already has access to this course
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_id", course_id)
      .eq("user_id", user.id)
      .single();

    if (enrollment) {
      return new Response(JSON.stringify({ success: false, error: "Już masz dostęp do tego kursu" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if Stripe price exists
    if (!course.stripe_price_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Cena nie została skonfigurowana. Skontaktuj się z administratorem." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get app URL from environment
    const appUrl = import.meta.env.PUBLIC_APP_URL || "http://localhost:4321";

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      priceId: course.stripe_price_id,
      courseId: course.id,
      userId: user.id,
      successUrl: `${appUrl}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/courses/${course.id}?canceled=true`,
    });

    // Create pending payment record
    await supabase.from("payments").insert({
      user_id: user.id,
      course_id: course.id,
      amount: course.price,
      currency: "PLN",
      stripe_checkout_session_id: session.id,
      status: "pending",
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Nie udało się utworzyć sesji płatności. Spróbuj ponownie później.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
