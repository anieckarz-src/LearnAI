import type { APIRoute } from "astro";

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
    const { title, content, order_index } = body;

    const { data: lesson, error } = await supabase
      .from("lessons")
      .update({ title, content, order_index })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data: lesson }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to update lesson" }), {
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

    const { error } = await supabase.from("lessons").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, message: "Lesson deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to delete lesson" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
