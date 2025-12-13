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
    const { status } = body;

    if (!status || !["pending", "reviewed", "resolved"].includes(status)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData: {
      status: string;
      reviewed_by?: string;
      reviewed_at?: string;
    } = {
      status,
    };

    if (status !== "pending") {
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data: report, error } = await supabase
      .from("content_reports")
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
      action: "update_report",
      entity_type: "content_report",
      entity_id: id,
      new_values: { status },
    });

    return new Response(JSON.stringify({ success: true, data: report }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to update report" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
