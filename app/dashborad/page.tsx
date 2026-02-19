import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Dashboard</h1>
      <p className="text-white/70">Signed in as: {data.user.email}</p>
    </div>
  );
}
