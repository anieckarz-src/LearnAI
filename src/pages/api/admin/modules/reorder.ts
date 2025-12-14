import type { APIRoute } from "astro";

// POST /api/admin/modules/reorder - Reorder modules within a course
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { supabase, user } = locals;
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { course_id, module_orders } = body;

    // Validation
    if (!course_id || !Array.isArray(module_orders)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "course_id and module_orders array are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update each module's order_index
    const updatePromises = module_orders.map(({ id, order_index }) =>
      supabase.from("modules").update({ order_index }).eq("id", id).eq("course_id", course_id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Error reordering modules:", errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to reorder some modules",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Modules reordered successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/modules/reorder:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
