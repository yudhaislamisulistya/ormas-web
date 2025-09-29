import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-red-700 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/assets/images/logo.jpeg"
            alt="Logo SI Ormas"
            width={120}
            height={120}
            priority
            className="rounded-full shadow-xl"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-wide mb-2">
          Selamat datang di SI ORMAS
        </h1>
        <p className="text-base sm:text-lg opacity-90 mb-8">
          Badan Kesatuan Bangsa dan Politik
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <Link
            href="/admin/login"
            className="inline-block w-full text-center py-3 px-5 rounded-2xl bg-white text-red-700 font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.99] transition"
            aria-label="Masuk sebagai Admin"
          >
            Admin
          </Link>

          <Link
            href="/guest/home"
            className="inline-block w-full text-center py-3 px-5 rounded-2xl bg-red-900/40 text-white ring-1 ring-white/30 font-semibold shadow-lg hover:bg-red-900/60 hover:scale-[1.02] active:scale-[0.99] transition"
            aria-label="Masuk sebagai Tamu"
          >
            Tamu / Guest
          </Link>
        </div>

        {/* Footer mini-note (optional) */}
        <p className="mt-8 text-xs opacity-80">
          © {new Date().getFullYear()} SI Ormas — YIS
        </p>
      </div>
    </main>
  );
}