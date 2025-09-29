import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (username === "admin" && password === "ORMAS123!") {
            localStorage.setItem("isAdmin", "true");
            router.push("/admin/dashboard");
        } else {
            setError("Username atau password salah");
        }
    };

    return (
        <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-white text-black rounded-2xl border border-black/10 shadow-sm p-6">
                <h1 className="text-xl font-semibold mb-4 text-center">Admin Login</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                            placeholder="Masukkan username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                            placeholder="Masukkan password"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full h-10 rounded-lg border border-black/20 bg-white text-black font-medium hover:bg-gray-100 transition"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
