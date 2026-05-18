"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, FileSpreadsheet } from "lucide-react";

interface InteractiveReportsTabsProps {
  initialTab: string;
  isAdminOrManager: boolean;
  insightsContent: React.ReactNode;
  exportsContent: React.ReactNode;
}

export function InteractiveReportsTabs({
  initialTab,
  isAdminOrManager,
  insightsContent,
  exportsContent
}: InteractiveReportsTabsProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync tab active state with initialTab changes (e.g. from browser back navigation)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    startTransition(() => {
      router.push(`/reports?tab=${tab}`);
    });
  };

  return (
    <div className="space-y-8">
      {/* Tabs Navigation (only shown for managers/admins) */}
      {isAdminOrManager && (
        <div className="flex border-b border-zinc-850 gap-6">
          <button 
            type="button"
            onClick={() => handleTabChange("insights")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center gap-2 outline-none cursor-pointer ${
              activeTab === "insights" 
                ? "border-blue-500 text-zinc-100 font-bold" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <TrendingUp size={16} /> Operational Insights
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange("exports")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center gap-2 outline-none cursor-pointer ${
              activeTab === "exports" 
                ? "border-blue-500 text-zinc-100 font-bold" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileSpreadsheet size={16} /> Custom Data Export
          </button>
        </div>
      )}

      {/* Tab Panels with shimmer animations */}
      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-20 flex flex-col justify-start pt-16 items-center pointer-events-none rounded-xl">
            <div className="w-full space-y-6 animate-pulse">
              <div className="h-6 w-48 bg-zinc-900 rounded-lg"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-4">
                    <div className="h-3 w-16 bg-zinc-800 rounded"></div>
                    <div className="h-8 w-24 bg-zinc-800 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={`transition-opacity duration-300 ${isPending ? "opacity-30" : "opacity-100"}`}>
          {activeTab === "insights" ? insightsContent : exportsContent}
        </div>
      </div>
    </div>
  );
}
