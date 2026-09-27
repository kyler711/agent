"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const emptyForm = {
  name: "",
  logoUrl: "",
  primaryColor: "#4f46e5",
  welcomeMessage: "Hi! How can I help you today?",
  location: "",
  hours: "",
  extraInfo: "",
  services: [{ name: "", price: "", description: "" }],
  faqs: [{ question: "", answer: "" }],
};

export default function AdminPanel({ businesses, baseUrl }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
  }

  async function startEdit(id) {
    setError("");
    const res = await fetch(`/api/admin/businesses/${id}`);
    if (!res.ok) {
      setError("Could not load business");
      return;
    }
    const data = await res.json();
    setForm({
      name: data.business.name || "",
      logoUrl: data.business.logo_url || "",
      primaryColor: data.business.primary_color || "#4f46e5",
      welcomeMessage: data.business.welcome_message || "",
      location: data.business.location || "",
      hours: data.business.hours || "",
      extraInfo: data.business.extra_info || "",
      services: data.services.length
        ? data.services.map((s) => ({ name: s.name, price: s.price || "", description: s.description || "" }))
        : [{ name: "", price: "", description: "" }],
      faqs: data.faqs.length
        ? data.faqs.map((f) => ({ question: f.question, answer: f.answer }))
        : [{ question: "", answer: "" }],
    });
    setEditingId(id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this business and all its leads/chat history? This cannot be undone.")) {
      return;
    }
    const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete business");
      return;
    }
    router.refresh();
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateService(i, key, value) {
    setForm((f) => {
      const services = [...f.services];
      services[i] = { ...services[i], [key]: value };
      return { ...f, services };
    });
  }

  function addService() {
    setForm((f) => ({ ...f, services: [...f.services, { name: "", price: "", description: "" }] }));
  }

  function removeService(i) {
    setForm((f) => ({ ...f, services: f.services.filter((_, idx) => idx !== i) }));
  }

  function updateFaq(i, key, value) {
    setForm((f) => {
      const faqs = [...f.faqs];
      faqs[i] = { ...faqs[i], [key]: value };
      return { ...f, faqs };
    });
  }

  function addFaq() {
    setForm((f) => ({ ...f, faqs: [...f.faqs, { question: "", answer: "" }] }));
  }

  function removeFaq(i) {
    setForm((f) => ({ ...f, faqs: f.faqs.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Business name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = editingId ? `/api/admin/businesses/${editingId}` : "/api/admin/businesses";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save business");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function embedSnippet(biz) {
    return `<script src="${baseUrl}/widget.js" data-business="${biz.widget_key}" data-color="${biz.primary_color}" data-name="${biz.name.replace(/"/g, "&quot;")}" async></script>`;
  }

  function copy(text, id) {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Businesses</h1>
        <div className="flex gap-2">
          <button
            onClick={startCreate}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Add business
          </button>
          <button onClick={logout} className="rounded-lg border px-3 py-1.5 text-sm text-gray-600">
            Log out
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 space-y-4 rounded-2xl border p-4">
          <h2 className="text-lg font-medium text-gray-900">
            {editingId ? "Edit business" : "New business"}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Business name"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={form.logoUrl}
              onChange={(e) => updateField("logoUrl", e.target.value)}
              placeholder="Logo URL (optional)"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Brand color
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="h-9 w-16 rounded border"
              />
            </label>
            <input
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Location / address"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={form.hours}
              onChange={(e) => updateField("hours", e.target.value)}
              placeholder="Opening hours (e.g. Mon-Fri 9am-6pm)"
              className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              value={form.welcomeMessage}
              onChange={(e) => updateField("welcomeMessage", e.target.value)}
              placeholder="Welcome message"
              className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
            />
            <textarea
              value={form.extraInfo}
              onChange={(e) => updateField("extraInfo", e.target.value)}
              placeholder="Anything else the AI should know (policies, parking, etc.)"
              className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
              rows={2}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Services</p>
            <div className="space-y-2">
              {form.services.map((s, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_2fr_auto]">
                  <input
                    value={s.name}
                    onChange={(e) => updateService(i, "name", e.target.value)}
                    placeholder="Service name"
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <input
                    value={s.price}
                    onChange={(e) => updateService(i, "price", e.target.value)}
                    placeholder="Price"
                    className="w-28 rounded-lg border px-3 py-2 text-sm"
                  />
                  <input
                    value={s.description}
                    onChange={(e) => updateService(i, "description", e.target.value)}
                    placeholder="Description (optional)"
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    className="text-sm text-gray-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addService} className="mt-2 text-sm text-indigo-600">
              + Add service
            </button>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">FAQs</p>
            <div className="space-y-2">
              {form.faqs.map((f, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={f.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                    placeholder="Question"
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <input
                    value={f.answer}
                    onChange={(e) => updateFaq(i, "answer", e.target.value)}
                    placeholder="Answer"
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="text-sm text-gray-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addFaq} className="mt-2 text-sm text-indigo-600">
              + Add FAQ
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create business"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {businesses.length === 0 && (
          <p className="text-sm text-gray-500">No businesses yet. Add your first one above.</p>
        )}
        {businesses.map((biz) => (
          <div key={biz.id} className="rounded-2xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: biz.primary_color }}
                />
                <span className="font-medium text-gray-900">{biz.name}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => startEdit(biz.id)} className="text-indigo-600">
                  Edit
                </button>
                <button onClick={() => handleDelete(biz.id)} className="text-red-600">
                  Delete
                </button>
              </div>
            </div>

            <p className="mb-1 text-xs font-medium text-gray-500">Embed code (paste before &lt;/body&gt;):</p>
            <div className="mb-2 flex items-start gap-2">
              <code className="block flex-1 overflow-x-auto rounded-lg bg-gray-100 p-2 text-xs">
                {embedSnippet(biz)}
              </code>
              <button
                onClick={() => copy(embedSnippet(biz), biz.id)}
                className="shrink-0 rounded-lg border px-2 py-1 text-xs"
              >
                {copiedId === biz.id ? "Copied!" : "Copy"}
              </button>
            </div>

            <p className="text-xs font-medium text-gray-500">Owner dashboard link:</p>
            <div className="flex items-start gap-2">
              <code className="block flex-1 overflow-x-auto rounded-lg bg-gray-100 p-2 text-xs">
                {`${baseUrl}/dashboard/${biz.dashboard_token}`}
              </code>
              <button
                onClick={() => copy(`${baseUrl}/dashboard/${biz.dashboard_token}`, `d-${biz.id}`)}
                className="shrink-0 rounded-lg border px-2 py-1 text-xs"
              >
                {copiedId === `d-${biz.id}` ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
