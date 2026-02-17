"use client";
import { useState, useMemo } from "react";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FF] px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[28px] p-10 shadow-sm border border-slate-100">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
        </div>

        {/* Form Section */}
        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-[12px] font-medium text-red-600 text-center animate-in fade-in zoom-in duration-200">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4">Username</label>
              <input
                type="email"
                placeholder="Username"
                required
                className="w-full rounded-full bg-[#F3F6FC] border border-transparent px-6 py-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-700 focus:bg-white transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                className="w-full rounded-full bg-[#F3F6FC] border border-transparent px-6 py-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-700 focus:bg-white transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full rounded-full bg-blue-700 py-4 mt-4 text-[14px] font-bold text-white uppercase tracking-widest hover:bg-blue-800 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            ROM Portal by RMMO &bull; 2026
          </p>
        </div>
      </div>
    </div>
  );
}