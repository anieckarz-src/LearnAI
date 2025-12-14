import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;

    const { data: course, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !course) {
      return new Response(JSON.stringify({ success: false, error: "Course not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get lessons for this course
    const { data: lessons } = await supabase.from("lessons").select("*").eq("course_id", id).order("order_index");

    return new Response(JSON.stringify({ success: true, data: { ...course, lessons: lessons || [] } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch course" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, thumbnail_url, status, price } = body;

    const { data: oldCourse } = await supabase.from("courses").select("*").eq("id", id).single();

    // Handle price updates and Stripe integration
    let stripeProductId = oldCourse?.stripe_product_id;
    let stripePriceId = oldCourse?.stripe_price_id;

    // If price is being set or changed, handle Stripe
    if (price !== undefined && price !== oldCourse?.price) {
      const { createOrUpdateStripeProduct, createStripePrice } = await import("@/lib/stripe.server");

      try {
        // Create or update product in Stripe
        if (!stripeProductId) {
          const product = await createOrUpdateStripeProduct(id, title || oldCourse.title, description);
          stripeProductId = product.id;
        }

        // Create new price in Stripe (if price is not null)
        if (price !== null && price > 0) {
          const stripePrice = await createStripePrice(stripeProductId, price);
          stripePriceId = stripePrice.id;
        } else {
          // If price is null or 0, clear Stripe price (make course free)
          stripePriceId = null;
        }
      } catch (stripeError) {
        console.error("Stripe error:", stripeError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update price in Stripe. Please check your Stripe configuration." }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      title,
      description,
      thumbnail_url,
      status,
    };

    if (price !== undefined) {
      updateData.price = price;
      updateData.stripe_product_id = stripeProductId;
      updateData.stripe_price_id = stripePriceId;
    }

    const { data: course, error } = await supabase
      .from("courses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "update_course",
      entity_type: "course",
      entity_id: id,
      old_values: oldCourse,
      new_values: course,
    });

    return new Response(JSON.stringify({ success: true, data: course }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to update course" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;

    const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "delete_course",
      entity_type: "course",
      entity_id: id,
      old_values: course,
    });

    return new Response(JSON.stringify({ success: true, message: "Course deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to delete course" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
