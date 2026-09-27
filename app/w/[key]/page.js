import { db } from "@/lib/db";
import ChatWidget from "./ChatWidget";

export const dynamic = "force-dynamic";

export default async function WidgetPage({ params }) {
  const { key } = await params;
  const supabase = db();

  const { data: business } = await supabase
    .from("businesses")
    .select("widget_key, name, logo_url, primary_color, welcome_message")
    .eq("widget_key", key)
    .single();

  if (!business) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center text-sm text-gray-500">
        This chat widget could not be found. Double-check the embed code.
      </div>
    );
  }

  return <ChatWidget business={business} />;
}
