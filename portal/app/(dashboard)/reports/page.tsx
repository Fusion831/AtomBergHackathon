import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
import { Download, FileSpreadsheet } from "lucide-react";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    redirect("/dashboard");
  }

  const isAdmin = session.user.role === "ADMIN";
  const cycles = await prisma.goalCycle.findMany({ orderBy: { startDate: "desc" } });
  const departments = isAdmin ? await prisma.department.findMany() : [];
  const managers = isAdmin ? await prisma.user.findMany({ where: { role: "MANAGER" } }) : [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Export Reports</h1>
          <p className="text-sm text-zinc-400 mt-1">Generate and download custom CSV achievement reports.</p>
        </div>
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
          <FileSpreadsheet size={24} />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/80">
          <h2 className="text-lg font-medium text-zinc-100">Achievement Report</h2>
          <p className="text-sm text-zinc-400 mt-1">Export employee goal progression, actuals, and scores based on specific timelines and metrics.</p>
        </div>
        <div className="p-6 bg-zinc-900/50">
          <ReportsFilters isAdmin={isAdmin} cycles={cycles} departments={departments} managers={managers} />
        </div>
      </div>
    </div>
  );
}
