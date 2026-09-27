"use client";

import { useEffect, useRef, useState } from "react";

function getOrCreateSessionId(widgetKey) {
  const storageKey = `ai-recept-session-${widgetKey}`;
  try {
    let id = sessionStorage.getItem(storageKey);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(storageKey, id);
    }
    return id;
  } catch {
    // sessionStorage can fail in some embedded/private contexts; fall back
    return crypto.randomUUID();
  }
}

export default function ChatWidget({ business }) {
  const [sessionId] = useState(() =>
    typeof window === "undefined" ? null : getOrCreateSessionId(business.widget_key)
  );
  const [messages, setMessages] = useState([
    { role: "assistant", content: business.welcome_message },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSaved, setBookingSaved] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, showBooking]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !sessionId) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetKey: business.widget_key, sessionId, message: text }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Sorry, something went wrong." },
      ]);
      if (data.showBookingForm) setShowBooking(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't send that. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      <header
        className="flex items-center gap-3 px-4 py-3 text-white shadow-sm"
        style={{ backgroundColor: business.primary_color || "#4f46e5" }}
      >
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt={business.name}
            className="h-8 w-8 rounded-full bg-white object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            {business.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{business.name}</p>
          <p className="text-xs text-white/80">Usually replies instantly</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-500">
              Typing…
            </div>
          </div>
        )}
        {showBooking && (
          <BookingForm
            business={business}
            sessionId={sessionId}
            saved={bookingSaved}
            onSaved={() => setBookingSaved(true)}
            onClose={() => setShowBooking(false)}
          />
        )}
      </div>

      <div className="border-t px-3 py-2">
        <button
          type="button"
          onClick={() => setShowBooking(true)}
          className="mb-2 w-full rounded-full border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Request a booking / leave your details
        </button>
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 rounded-full border px-3 py-2 text-sm outline-none focus:border-gray-400"
            maxLength={1500}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: business.primary_color || "#4f46e5" }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function BookingForm({ business, sessionId, saved, onSaved, onClose }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [serviceWanted, setServiceWanted] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      setError("Please share your name and a phone number or email.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetKey: business.widget_key,
          sessionId,
          name,
          contact,
          serviceWanted,
          preferredDate,
          preferredTimeOfDay,
          notes,
        }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "That time is fully booked. Please pick a different time.");
        return;
      }
      if (!res.ok) throw new Error("failed");
      onSaved();
    } catch {
      setError("Something went wrong saving your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="rounded-2xl border bg-green-50 p-4 text-sm text-green-800">
        Thanks, {name || "there"}! We&apos;ve received your request and {business.name}&apos;s staff
        will reach out to you soon.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-gray-500">
          <strong>Privacy notice:</strong> the details below are only used by{" "}
          {business.name} to contact you about your request. Please don&apos;t share anything
          else sensitive.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Phone or email"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <input
          value={serviceWanted}
          onChange={(e) => setServiceWanted(e.target.value)}
          placeholder="Service you'd like (optional)"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            aria-label="Preferred date (optional)"
            className="w-1/2 rounded-lg border px-3 py-2 text-sm text-gray-700"
          />
          <input
            type="time"
            value={preferredTimeOfDay}
            onChange={(e) => setPreferredTimeOfDay(e.target.value)}
            aria-label="Preferred time (optional)"
            className="w-1/2 rounded-lg border px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else? (optional)"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          rows={2}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: business.primary_color || "#4f46e5" }}
        >
          {submitting ? "Sending…" : "Send request"}
        </button>
      </form>
    </div>
  );
}
