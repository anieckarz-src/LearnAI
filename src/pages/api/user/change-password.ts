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
    const { current_password, new_password } = body;

    // Validation
    if (!current_password || typeof current_password !== "string") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Obecne hasło jest wymagane" 
        }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!new_password || typeof new_password !== "string") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nowe hasło jest wymagane" 
        }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nowe hasło musi mieć minimum 8 znaków" 
        }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (current_password === new_password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nowe hasło musi być inne niż obecne" 
        }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    });

    if (signInError) {
      console.error("Current password verification failed:", signInError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nieprawidłowe obecne hasło" 
        }), 
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      
      // Handle specific Supabase errors
      if (updateError.message.includes("New password should be different")) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Nowe hasło musi być inne niż poprzednie" 
          }), 
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nie udało się zmienić hasła" 
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
        message: "Hasło zostało zmienione pomyślnie" 
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in change-password:", error);
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
