import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F4EE" }}>
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl">🔒</div>
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>
          Unauthorized
        </h1>
        <p className="text-lg" style={{ color: "#6B7280" }}>
          You must be logged in to access this page.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-lg font-medium transition-all duration-200"
          style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}
