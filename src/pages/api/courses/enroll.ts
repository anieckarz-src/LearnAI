import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Musisz być zalogowany" }), {
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
      .select("id, price, status")
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
    if (course.price && course.price > 0) {
      return new Response(JSON.stringify({ success: false, error: "Ten kurs jest płatny. Użyj opcji zakupu." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_id", course_id)
      .eq("user_id", user.id)
      .single();

    if (existingEnrollment) {
      return new Response(JSON.stringify({ success: true, message: "Już jesteś zapisany na ten kurs" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create enrollment
    const { error: enrollError } = await supabase.from("course_enrollments").insert({
      course_id: course_id,
      user_id: user.id,
    });

    if (enrollError) {
      throw enrollError;
    }

    return new Response(JSON.stringify({ success: true, message: "Zostałeś zapisany na kurs" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return new Response(JSON.stringify({ success: false, error: "Nie udało się zapisać na kurs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
