import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CycleManagement } from "@/components/admin/CycleManagement";
import { UnlockModal } from "@/components/admin/UnlockModal";
import { Users, FileText, Lock, Calendar } from "lucide-react";

export default async function AdminGovernancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch cycles
  const cycles = await prisma.goalCycle.findMany({
    orderBy: { startDate: "desc" }
  });

  const activeCycle = cycles.find(c => c.isActive);

  // Fetch overall completion metrics
  const totalEmployees = await prisma.user.count({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } }
  });

  const sheets = await prisma.goalSheet.findMany({
    where: { cycleId: activeCycle?.id },
    include: { user: true }
  });

  const lockedCount = sheets.filter(s => s.status === "LOCKED" || s.status === "APPROVED").length;
  const draftCount = sheets.filter(s => s.status === "DRAFT").length;
  const reviewCount = sheets.filter(s => s.status === "UNDER_REVIEW" || s.status === "SUBMITTED").length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Governance Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage organizational goal cycles, monitor completion rates, and handle override requests.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-sm text-zinc-400">Total Participants</p>
            <p className="text-2xl font-semibold text-zinc-100">{totalEmployees}</p>
          </div>
        </div>
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><Lock size={24} /></div>
          <div>
            <p className="text-sm text-zinc-400">Locked / Approved</p>
            <p className="text-2xl font-semibold text-zinc-100">{lockedCount}</p>
          </div>
        </div>
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><FileText size={24} /></div>
          <div>
            <p className="text-sm text-zinc-400">Pending Review</p>
            <p className="text-2xl font-semibold text-zinc-100">{reviewCount}</p>
          </div>
        </div>
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-zinc-800 text-zinc-400 rounded-lg"><Calendar size={24} /></div>
          <div>
            <p className="text-sm text-zinc-400">In Draft</p>
            <p className="text-2xl font-semibold text-zinc-100">{draftCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-medium text-zinc-100">Goal Sheet Overrides</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {lockedCount === 0 ? (
              <div className="p-8 text-center text-zinc-500">No locked sheets available to manage.</div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {sheets.filter(s => s.status === "LOCKED" || s.status === "APPROVED").map(sheet => (
                  <div key={sheet.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                    <div>
                      <h4 className="text-zinc-200 font-medium">{sheet.user.name}</h4>
                      <p className="text-xs text-zinc-500">{sheet.user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded">Locked</span>
                      <UnlockModal sheetId={sheet.id} userName={sheet.user.name} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <CycleManagement cycles={cycles} activeCycle={activeCycle} />
        </div>
      </div>
    </div>
  );
}
