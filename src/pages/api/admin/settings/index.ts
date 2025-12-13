import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { data: settings, error } = await supabase.from("system_settings").select("*");

    if (error) {
      throw error;
    }

    // Convert array to object for easier access
    const settingsObj = (settings || []).reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, any>
    );

    return new Response(JSON.stringify({ success: true, data: settingsObj }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const updates = [];

    for (const [key, value] of Object.entries(body)) {
      updates.push(
        supabase.from("system_settings").upsert({
          key,
          value: { value },
          updated_by: user.id,
        })
      );
    }

    await Promise.all(updates);

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "update_settings",
      entity_type: "system_settings",
      new_values: body,
    });

    return new Response(JSON.stringify({ success: true, message: "Settings updated successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to update settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
