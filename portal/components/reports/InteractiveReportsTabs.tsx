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

  // Sync tab active state with initialTab changes
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
    <div className="space-y-6 select-none">
      {/* Tabs Navigation (only shown for managers/admins) */}
      {isAdminOrManager && (
        <div className="flex border-b border-zinc-900 gap-6 text-xs font-semibold">
          <button 
            type="button"
            onClick={() => handleTabChange("insights")}
            className={`pb-3 border-b-2 transition-all duration-200 flex items-center gap-1.5 outline-none cursor-pointer ${
              activeTab === "insights" 
                ? "border-blue-500 text-zinc-100 font-bold" 
                : "border-transparent text-zinc-550 hover:text-zinc-350"
            }`}
          >
            <TrendingUp size={14} /> Performance Insights
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange("exports")}
            className={`pb-3 border-b-2 transition-all duration-200 flex items-center gap-1.5 outline-none cursor-pointer ${
              activeTab === "exports" 
                ? "border-blue-500 text-zinc-100 font-bold" 
                : "border-transparent text-zinc-550 hover:text-zinc-350"
            }`}
          >
            <FileSpreadsheet size={14} /> Corporate Reports & Exports
          </button>
        </div>
      )}

      {/* Tab Panels with stable container sizing to prevent layout jitter */}
      <div className="relative min-h-[500px] w-full">
        {isPending && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] z-20 flex flex-col justify-start pt-16 items-center pointer-events-none rounded-xl">
            <div className="w-full space-y-6 animate-pulse">
              <div className="h-4 w-48 bg-zinc-900 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="p-6 bg-zinc-950/20 border border-zinc-900 rounded-2xl space-y-4">
                    <div className="h-2 w-16 bg-zinc-900 rounded"></div>
                    <div className="h-6 w-24 bg-zinc-900 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={`transition-all duration-200 ${isPending ? "opacity-20 blur-[0.5px]" : "opacity-100"}`}>
          {activeTab === "insights" ? insightsContent : exportsContent}
        </div>
      </div>
    </div>
  );
}
