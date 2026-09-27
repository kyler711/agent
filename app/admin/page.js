import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminRequest();

  if (!authed) {
    return <AdminLogin />;
  }

  const supabase = db();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return <AdminPanel businesses={businesses || []} baseUrl={baseUrl} />;
}
