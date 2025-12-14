import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ redirect }) => {
  // User canceled the payment
  // Redirect back to courses page with a canceled message
  return redirect("/courses?payment=canceled");
};
