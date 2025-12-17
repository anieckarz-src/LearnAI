import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirm_password")?.toString();
    const fullName = formData.get("full_name")?.toString();

    // Validate required fields
    if (!email || !password) {
      return redirect("/register?error=missing_fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return redirect("/register?error=invalid_email");
    }

    // Validate password strength
    if (password.length < 8) {
      return redirect("/register?error=weak_password");
    }

    // Validate passwords match
    if (confirmPassword && password !== confirmPassword) {
      return redirect("/register?error=passwords_mismatch");
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Sign up the user with email auto-confirm enabled
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        },
        emailRedirectTo: undefined, // No email confirmation needed
      },
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);

      // Handle specific errors
      if (signUpError.message.includes("already registered")) {
        return redirect("/register?error=email_exists");
      }

      return redirect("/register?error=server_error");
    }

    if (!authData.user) {
      return redirect("/register?error=server_error");
    }

    // Auto-confirm email using admin client (bypasses email confirmation)
    // This is safe because we're using the service role key
    if (!authData.user.email_confirmed_at) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        email_confirm: true,
      });

      if (confirmError) {
        console.error("Error confirming email:", confirmError);
        // Continue anyway - the user is created, they just need to confirm manually
      }
    }

    // Create user profile in public.users table
    // This should be handled by a trigger, but we'll add it here as a fallback
    const { error: userError } = await supabaseAdmin.from("users").upsert(
      {
        id: authData.user.id,
        email: email,
        full_name: fullName || null,
        role: "user",
        is_blocked: false,
      },
      {
        onConflict: "id",
      }
    );

    if (userError) {
      console.error("Error creating user profile:", userError);
      // Don't fail the registration if profile creation fails
      // The trigger should handle it
    }

    // Sign in the user to get session tokens
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      // Registration succeeded but auto-login failed
      // Redirect to login page with success message
      return redirect("/login?success=registered");
    }

    // Set session cookies
    cookies.set("sb-access-token", signInData.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    cookies.set("sb-refresh-token", signInData.session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Redirect to dashboard
    return redirect("/dashboard");
  } catch (error) {
    console.error("Signup error:", error);
    return redirect("/register?error=server_error");
  }
};
