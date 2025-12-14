import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { supabase, session } = locals;
    if (!session?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userData?.role !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { module_id, include_lessons = true } = body;

    if (!module_id) {
      return new Response(JSON.stringify({ success: false, error: "module_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the original module
    const { data: originalModule, error: fetchError } = await supabase
      .from("modules")
      .select("*")
      .eq("id", module_id)
      .single();

    if (fetchError || !originalModule) {
      return new Response(JSON.stringify({ success: false, error: "Module not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the highest order_index for this course
    const { data: maxOrderData } = await supabase
      .from("modules")
      .select("order_index")
      .eq("course_id", originalModule.course_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const newOrderIndex = (maxOrderData?.order_index ?? -1) + 1;

    // Create new module with "(kopia)" suffix
    const { data: newModule, error: createError } = await supabase
      .from("modules")
      .insert({
        title: `${originalModule.title} (kopia)`,
        description: originalModule.description,
        course_id: originalModule.course_id,
        order_index: newOrderIndex,
      })
      .select()
      .single();

    if (createError || !newModule) {
      return new Response(JSON.stringify({ success: false, error: "Failed to create module copy" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let newLessons = [];

    // Duplicate lessons if requested
    if (include_lessons) {
      const { data: originalLessons } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", module_id)
        .order("order_index", { ascending: true });

      if (originalLessons && originalLessons.length > 0) {
        const lessonsToInsert = originalLessons.map((lesson, index) => ({
          title: lesson.title,
          type: lesson.type,
          content: lesson.content,
          video_url: lesson.video_url,
          files: lesson.files,
          module_id: newModule.id,
          course_id: originalModule.course_id,
          order_index: index,
        }));

        const { data: insertedLessons } = await supabase
          .from("lessons")
          .insert(lessonsToInsert)
          .select();

        newLessons = insertedLessons || [];
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          module: newModule,
          lessons: newLessons,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error duplicating module:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
