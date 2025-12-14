import type { APIRoute } from "astro";
import { supabase } from "@/lib/supabase";

// GET /api/admin/modules/:id - Get a single module
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const user = locals.user;
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;

    const { data: module, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !module) {
      return new Response(JSON.stringify({ success: false, error: "Module not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: module }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/modules/:id:", error);
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

// PATCH /api/admin/modules/:id - Update a module
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const user = locals.user;
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    const body = await request.json();
    const { title, description, order_index } = body;

    // Validation
    if (title && title.length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: "Title must be at least 3 characters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order_index !== undefined) updateData.order_index = order_index;

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No fields to update" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: module, error } = await supabase
      .from("modules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating module:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!module) {
      return new Response(JSON.stringify({ success: false, error: "Module not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: module }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/modules/:id:", error);
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

// DELETE /api/admin/modules/:id - Delete a module
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const user = locals.user;
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;

    // Check if module has lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id")
      .eq("module_id", id)
      .limit(1);

    if (lessonsError) {
      console.error("Error checking lessons:", lessonsError);
      return new Response(JSON.stringify({ success: false, error: lessonsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (lessons && lessons.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Cannot delete module with existing lessons. Please delete or move the lessons first.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { error } = await supabase.from("modules").delete().eq("id", id);

    if (error) {
      console.error("Error deleting module:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Module deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/modules/:id:", error);
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
