import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReportsFilters } from "@/components/reports/ReportsFilters";
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
import { FileSpreadsheet, BarChart3, TrendingUp, Sparkles } from "lucide-react";

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
  const activeCycle = await prisma.goalCycle.findFirst({
    where: { isActive: true }
  });

  if (!activeCycle) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-zinc-200">No Active Goal Cycle</h2>
        <p className="text-zinc-500 text-sm mt-2">Please contact an administrator to activate a performance cycle.</p>
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

  // Cycle filters (for reports filters panel)
  const cycles = await prisma.goalCycle.findMany({ orderBy: { startDate: "desc" } });
  const departments = session.user.role === "ADMIN" ? await prisma.department.findMany() : [];
  const managers = session.user.role === "ADMIN" ? await prisma.user.findMany({ where: { role: "MANAGER" } }) : [];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 pb-24">
      {/* Premium Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              {session.user.role === "EMPLOYEE" ? "Personal Insights" : "Executive Insights & Reports"}
            </h1>
            {session.user.role === "EMPLOYEE" && (
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                <Sparkles size={10} /> Career Growth
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            {session.user.role === "EMPLOYEE" 
              ? "Track your goals progression, contributions, and timeline updates."
              : `Real-time analytics and achievement reporting for ${activeCycle.name}.`
            }
          </p>
        </div>
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shrink-0">
          <BarChart3 size={24} />
        </div>
      </div>

      {/* Tabs Navigation (only shown for managers/admins) */}
      {isAdminOrManager && (
        <div className="flex border-b border-zinc-800 gap-6">
          <Link 
            href="/reports?tab=insights" 
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "insights" 
                ? "border-blue-500 text-zinc-100" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <TrendingUp size={16} /> Operational Insights
          </Link>
          <Link 
            href="/reports?tab=exports" 
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "exports" 
                ? "border-blue-500 text-zinc-100" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileSpreadsheet size={16} /> Custom Data Export
          </Link>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === "insights" ? (
        <AnalyticsDashboard role={session.user.role as "ADMIN" | "MANAGER" | "EMPLOYEE"} data={analyticsData} />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in-50 duration-300">
          <div className="p-5 border-b border-zinc-800/80">
            <h2 className="text-lg font-medium text-zinc-100">Achievement Report</h2>
            <p className="text-sm text-zinc-400 mt-1">Export employee goal progression, actuals, and scores based on specific timelines and metrics.</p>
          </div>
          <div className="p-6 bg-zinc-900/50">
            <ReportsFilters 
              isAdmin={session.user.role === "ADMIN"} 
              cycles={cycles} 
              departments={departments} 
              managers={managers} 
            />
          </div>
        </div>
      )}
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
