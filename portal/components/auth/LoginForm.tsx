"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("employee@test.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
      } else {
        router.push("/goals/draft");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">{error}</div>}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Email</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required 
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Password</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required 
        />
      </div>
      <button 
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
