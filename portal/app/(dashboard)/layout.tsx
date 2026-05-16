import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 flex flex-col">
      <header className="border-b border-zinc-900 bg-zinc-950/50 p-4 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-medium tracking-tight text-blue-400">AtomQuest Portal</h1>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-zinc-400">
              <a href="/goals/draft" className="hover:text-zinc-100 transition-colors">My Goals</a>
              <a href="/checkins" className="hover:text-zinc-100 transition-colors">Check-ins</a>
              {(session.user.role === "MANAGER" || session.user.role === "ADMIN") && (
                <>
                  <a href="/manager/review" className="hover:text-zinc-100 transition-colors">Team Reviews</a>
                  <a href="/manager/checkins" className="hover:text-zinc-100 transition-colors">Team Check-ins</a>
                  <a href="/manager/shared-goals" className="hover:text-zinc-100 transition-colors">Shared KPIs</a>
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