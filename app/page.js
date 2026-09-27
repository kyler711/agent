import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <h1 className="text-3xl font-bold text-gray-900">AI Receptionist</h1>
      <p className="mt-3 max-w-md text-gray-600">
        A chat widget small businesses can add to their website in one line of code.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/demo"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          View live demo
        </Link>
        <Link href="/admin" className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700">
          Admin login
        </Link>
      </div>
    </div>
  );
}
