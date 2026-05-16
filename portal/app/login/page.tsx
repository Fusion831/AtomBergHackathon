import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Target } from "lucide-react";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    redirect("/goals/draft");
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-60"></div>
      
      {/* Decorative grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative w-full max-w-sm z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-500/10 rounded-2xl mb-4 border border-blue-500/20">
            <Target className="text-blue-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">AtomQuest</h1>
          <p className="text-zinc-500 mt-2 text-sm text-center">Enterprise Goal Management & Cascading KPIs</p>
        </div>

        <div className="p-8 space-y-6 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-zinc-200">Sign in to your account</h2>
            <p className="text-sm text-zinc-500 mt-1">Enter your organizational credentials to continue</p>
          </div>
          
          <LoginForm />
        </div>

        <div className="mt-8 text-center text-xs text-zinc-600 space-y-1">
          <p>Demo accounts (Password: <span className="text-zinc-400 font-mono">password123</span>)</p>
          <p className="flex items-center justify-center gap-3">
            <span>Admin: <span className="text-zinc-400">admin1@company.com</span></span>
            <span>Manager: <span className="text-zinc-400">manager1@company.com</span></span>
          </p>
        </div>
      </div>
    </div>
  );
}
