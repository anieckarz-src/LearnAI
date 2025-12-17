import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Nie jesteś zalogowany" 
      }), 
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();
    const { full_name } = body;

    // Validation
    if (!full_name || typeof full_name !== "string") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Imię i nazwisko jest wymagane" 
        }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const trimmedName = full_name.trim();

    if (trimmedName.length < 2) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Imię i nazwisko musi mieć minimum 2 znaki" 
        }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (trimmedName.length > 100) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Imię i nazwisko nie może być dłuższe niż 100 znaków" 
        }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update user profile in database
    const { data, error } = await supabase
      .from("users")
      .update({ full_name: trimmedName })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nie udało się zaktualizować profilu" 
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
        data: {
          full_name: data.full_name,
        }
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in update-profile:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Wystąpił błąd serwera" 
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
