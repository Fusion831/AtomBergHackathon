"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("employee@test.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsTransitioning(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials. Please try again.");
        setIsLoading(false);
        setIsTransitioning(false);
      } else {
        // Fetch session to determine target redirection role
        const session = await getSession();
        if (session?.user?.role === "ADMIN") {
          router.push("/admin/governance");
        } else {
          router.push("/goals/draft");
        }
        
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsLoading(false);
      setIsTransitioning(false);
    }
  };

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
          {error}
        </div>
      )}
      
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Email Address</label>
        <div className="relative">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
            placeholder="name@company.com"
            required 
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Password</label>
        <div className="relative">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
            placeholder="••••••••"
            required 
          />
        </div>
      </div>

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2.5 mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:text-white/50 text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </>
        ) : "Sign In"}
      </button>
    </form>
    
    {isTransitioning && mounted && createPortal(
      <div className="fixed inset-0 z-[9999] bg-black flex animate-fade-in font-sans">
        {/* Left Sidebar Skeleton */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shrink-0 h-full">
          <div className="space-y-8">
            {/* Brand Pulsing Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-blue-500/20 animate-pulse"></div>
              </div>
              <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse"></div>
            </div>

            {/* Sidebar Nav Items */}
            <div className="space-y-6">
              <div className="space-y-2.5">
                <div className="h-3 w-16 bg-zinc-900 rounded animate-pulse mb-4"></div>
                <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900/40 rounded-lg">
                  <div className="w-4 h-4 rounded bg-zinc-800 animate-pulse"></div>
                  <div className="h-3.5 w-20 bg-zinc-800 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-4 h-4 rounded bg-zinc-900 animate-pulse"></div>
                  <div className="h-3.5 w-24 bg-zinc-900 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-4 h-4 rounded bg-zinc-900 animate-pulse"></div>
                  <div className="h-3.5 w-16 bg-zinc-900 rounded animate-pulse"></div>
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-zinc-900">
                <div className="h-3 w-20 bg-zinc-900 rounded animate-pulse mb-4"></div>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-4 h-4 rounded bg-zinc-900 animate-pulse"></div>
                  <div className="h-3.5 w-28 bg-zinc-900 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-4 h-4 rounded bg-zinc-900 animate-pulse"></div>
                  <div className="h-3.5 w-24 bg-zinc-900 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom User Badge Skeleton */}
          <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-850 animate-pulse"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-2.5 w-12 bg-zinc-850 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton Area */}
        <div className="flex-1 flex flex-col h-full bg-black">
          {/* Top Header Skeleton */}
          <div className="h-[60px] border-b border-zinc-800/80 bg-zinc-950/80 px-8 flex items-center justify-between">
            <div className="h-4 w-36 bg-zinc-900 rounded animate-pulse"></div>
            <div className="flex items-center gap-4">
              <div className="h-3 w-24 bg-zinc-900 rounded animate-pulse"></div>
              <div className="w-8 h-8 rounded-full bg-zinc-900 animate-pulse"></div>
            </div>
          </div>

          {/* Content Pulse Frame */}
          <div className="flex-1 p-8 space-y-8 max-w-5xl w-full mx-auto overflow-hidden">
            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="h-7 w-48 bg-zinc-900/80 rounded-lg animate-pulse"></div>
              <div className="h-3.5 w-80 bg-zinc-900/40 rounded animate-pulse"></div>
            </div>

            {/* 3 Metrics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-zinc-900/20 border border-zinc-850 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-20 bg-zinc-900 rounded animate-pulse"></div>
                    <div className="w-5 h-5 bg-zinc-900 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-8 w-16 bg-zinc-900 rounded-lg animate-pulse"></div>
                  <div className="h-3 w-28 bg-zinc-900/60 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Big Layout card skeleton */}
            <div className="border border-zinc-850 bg-zinc-900/10 rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-850">
                <div className="h-4.5 w-32 bg-zinc-900 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-zinc-900 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center py-2.5">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-zinc-900 rounded-lg animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-3.5 w-36 bg-zinc-900 rounded animate-pulse"></div>
                        <div className="h-2.5 w-24 bg-zinc-900/60 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-3 w-16 bg-zinc-900 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
