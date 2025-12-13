import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const redirectTo = formData.get("redirect")?.toString() || "/admin/dashboard";

    if (!email || !password) {
      return redirect("/login?error=missing_credentials");
    }

    // Logowanie przez Supabase
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Login error:", data);
      return redirect("/login?error=invalid_credentials");
    }

    // Ustaw cookies z tokenami
    cookies.set("sb-access-token", data.access_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dni
    });

    cookies.set("sb-refresh-token", data.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dni
    });

    return redirect(redirectTo);
  } catch (error) {
    console.error("Login error:", error);
    return redirect("/login?error=server_error");
  }
};
