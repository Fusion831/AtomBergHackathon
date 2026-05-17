import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Target } from "lucide-react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-black text-slate-50 flex flex-col font-sans selection:bg-blue-500/30">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 px-6 py-3.5 sticky top-0 z-50 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Target size={18} className="text-blue-400" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-100">AtomQuest</h1>
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-zinc-400">
              {session.user.role !== "ADMIN" && (
                <>
                  <a href="/goals/draft" className="hover:text-zinc-100 transition-colors">My Goals</a>
                  <a href="/checkins" className="hover:text-zinc-100 transition-colors">Check-ins</a>
                </>
              )}
              {(session.user.role === "MANAGER" || session.user.role === "ADMIN") && (
                <>
                  <a href="/manager/review" className="hover:text-zinc-100 transition-colors">Team Reviews</a>
                  <a href="/manager/checkins" className="hover:text-zinc-100 transition-colors">Team Check-ins</a>
                  <a href="/manager/shared-goals" className="hover:text-zinc-100 transition-colors">Shared KPIs</a>
                  <a href="/directory" className="hover:text-zinc-100 transition-colors">Directory</a>
                  <a href="/reports" className="hover:text-zinc-100 transition-colors">Reports</a>
                </>
              )}
              {session.user.role === "ADMIN" && (
                <a href="/admin/governance" className="hover:text-zinc-100 transition-colors text-amber-500/80 hover:text-amber-400">Admin</a>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{session.user.name} ({session.user.role})</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}