import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
import { InteractiveReportsTabs } from "@/components/reports/InteractiveReportsTabs";
import { 
  AnalyticsDashboard, 
  AdminAnalyticsData, 
  ManagerAnalyticsData, 
  EmployeeAnalyticsData 
} from "@/components/reports/AnalyticsDashboard";
import { 
  getAdminAnalytics, 
  getManagerAnalytics, 
  getEmployeeAnalytics 
} from "@/lib/analytics";
import { FileSpreadsheet, BarChart3, Sparkles } from "lucide-react";
import { getLifecycleAwareCycle } from "@/lib/quarterLifecycle";

export default async function ReportsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ tab?: string }> 
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "insights";

  // 1. Fetch active goal cycle
  const rawCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true }
  });
  const activeCycle = getLifecycleAwareCycle(rawCycle);

  if (!activeCycle) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center select-none">
        <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-sm font-bold text-zinc-300">No Active Performance Cycle</h2>
        <p className="text-xs text-zinc-550 mt-2">Please contact an operations administrator to activate an active performance cycle.</p>
      </div>
    );
  }

  // 2. Fetch role-scoped analytics data
  const activeQuarter = activeCycle.activeQuarter || "Q2";
  let analyticsData: AdminAnalyticsData | ManagerAnalyticsData | EmployeeAnalyticsData | null = null;

  try {
    if (session.user.role === "ADMIN") {
      analyticsData = await getAdminAnalytics(activeCycle.id, activeQuarter);
    } else if (session.user.role === "MANAGER") {
      analyticsData = await getManagerAnalytics(session.user.id, activeCycle.id, activeQuarter);
    } else {
      analyticsData = await getEmployeeAnalytics(session.user.id, activeCycle.id, activeQuarter);
    }
  } catch (error) {
    console.error("Error building analytics data:", error);
  }

  const isAdminOrManager = session.user.role === "ADMIN" || session.user.role === "MANAGER";
  
  // Enforce security for exports
  const activeTab = isAdminOrManager ? currentTab : "insights";

  // Cycle filters
  const cycles = await prisma.goalCycle.findMany({ orderBy: { startDate: "desc" } });
  const departments = session.user.role === "ADMIN" ? await prisma.department.findMany() : [];
  const managers = session.user.role === "ADMIN" ? await prisma.user.findMany({ where: { role: "MANAGER" } }) : [];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 pb-24 select-none">
      {/* Title Header - quiet, premium, executive layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-150 tracking-tight">
              {session.user.role === "EMPLOYEE" ? "Performance Insights" : "Organization Reports"}
            </h1>
            {session.user.role === "EMPLOYEE" && (
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase rounded-md flex items-center gap-1">
                <Sparkles size={10} /> Insights
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-550 mt-1 max-w-xl leading-relaxed">
            {session.user.role === "EMPLOYEE" 
              ? "Review your personal achievements, active quarter updates, and success metrics."
              : `Real-time organizational compliance and objective performance analytics for ${activeCycle.name}.`
            }
          </p>
        </div>
        <div className="p-2.5 bg-blue-500/10 text-blue-450 border border-blue-500/20 rounded-xl shrink-0">
          <BarChart3 size={20} />
        </div>
      </div>

      <InteractiveReportsTabs 
        initialTab={activeTab}
        isAdminOrManager={isAdminOrManager}
        insightsContent={
          <AnalyticsDashboard role={session.user.role as "ADMIN" | "MANAGER" | "EMPLOYEE"} data={analyticsData} />
        }
        exportsContent={
          <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in-50 duration-300">
            <div className="p-5 border-b border-zinc-900">
              <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-450" />
                Consensus & Alignment Export
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Generate filtered spreadsheet archives detailing alignment metrics, actuals, and finalized outcomes.</p>
            </div>
            <div className="p-6 bg-zinc-950/10">
              <ReportsFilters 
                isAdmin={session.user.role === "ADMIN"} 
                cycles={cycles} 
                departments={departments} 
                managers={managers} 
              />
            </div>
          </div>
        }
      />
    </div>
  );
}

// Fallback error alert helper
function AlertTriangle({ size, className }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
