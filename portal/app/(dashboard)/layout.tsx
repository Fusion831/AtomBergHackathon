import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 flex flex-col">
      <header className="border-b border-zinc-900 bg-zinc-950/50 p-4 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-medium tracking-tight text-blue-400">AtomQuest Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{session.user.name} ({session.user.role})</span>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}