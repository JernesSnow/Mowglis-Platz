import { createClient as createServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function getAdminProfile() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const admin = createSupabaseAdmin();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(`
      id,
      nombre,
      rol
    `)
    .eq("id", user.id)
    .eq("rol", "admin")
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return {
    user,
    profile,
  };
}