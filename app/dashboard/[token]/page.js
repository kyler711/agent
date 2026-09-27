import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

export default async function DashboardPage({ params }) {
  const { token } = await params;
  const supabase = db();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("dashboard_token", token)
    .single();

  if (!business) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center text-sm text-gray-500">
        This dashboard link is not valid. Please check the link your provider gave you.
      </div>
    );
  }

  const [{ data: leads }, { data: chatRows }] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("chat_messages")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true }),
  ]);

  const conversations = new Map();
  for (const row of chatRows || []) {
    if (!conversations.has(row.session_id)) conversations.set(row.session_id, []);
    conversations.get(row.session_id).push(row);
  }
  const conversationList = Array.from(conversations.entries()).sort((a, b) => {
    const aLast = a[1][a[1].length - 1]?.created_at || "";
    const bLast = b[1][b[1].length - 1]?.created_at || "";
    return bLast.localeCompare(aLast);
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center gap-3">
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt={business.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: business.primary_color || "#4f46e5" }}
          >
            {business.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{business.name} — Dashboard</h1>
          <p className="text-sm text-gray-500">Leads, booking requests and chat history</p>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium text-gray-900">
          Leads &amp; booking requests ({(leads || []).length})
        </h2>
        {!leads || leads.length === 0 ? (
          <p className="text-sm text-gray-500">No leads yet. Once your widget collects one, it&apos;ll show up here.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">When</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Contact</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Service</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Preferred time</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">{lead.name}</td>
                    <td className="px-3 py-2 text-gray-700">{lead.contact}</td>
                    <td className="px-3 py-2 text-gray-700">{lead.service_wanted || "—"}</td>
                    <td className="px-3 py-2 text-gray-700">{lead.preferred_time || "—"}</td>
                    <td className="px-3 py-2 text-gray-700">{lead.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-gray-900">
          Chat conversations ({conversationList.length})
        </h2>
        {conversationList.length === 0 ? (
          <p className="text-sm text-gray-500">No conversations yet.</p>
        ) : (
          <div className="space-y-2">
            {conversationList.map(([sessionId, msgs]) => (
              <details key={sessionId} className="rounded-xl border p-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-800">
                  {formatDate(msgs[0].created_at)} — {msgs.length} messages
                </summary>
                <div className="mt-3 space-y-2">
                  {msgs.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-1.5 text-sm ${
                        m.role === "user"
                          ? "ml-auto bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
