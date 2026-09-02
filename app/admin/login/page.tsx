import { redirect } from "next/navigation";

import LoginForm from "@/components/admin/LoginForm";
import { getAdminProfile } from "@/lib/auth/getAdminProfile";

export default async function AdminLoginPage() {
  const admin = await getAdminProfile();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f1df] px-4">
      <LoginForm />
    </main>
  );
}