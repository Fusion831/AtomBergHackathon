"use client";

import { useState } from "react";
import { 
  TrendingUp, Users, Target, CheckCircle2, AlertTriangle, 
  Hourglass, Building2, ShieldAlert, Award, Calendar, FileSpreadsheet 
} from "lucide-react";
import { UomType } from "@prisma/client";
import { 
  DepartmentCompletion, 
  ThrustAreaDistribution, 
  UomDistribution, 
  ManagerPerformance, 
  QoQTrendPoint 
} from "@/lib/analytics";

export interface MemberProgressItem {
  id: string;
  name: string;
  email: string;
  empId: string;
  sheetStatus: string;
  sheetId: string | null;
  goalsCount: number;
  avgProgress: number;
}

export interface SharedKpiItem {
  id: string;
  title: string;
  targetValue: number | null;
  uomType: string;
  cascadeCount: number;
  avgProgress: number;
}

export interface FeedbackTimelineItem {
  id: string;
  action: string;
  timestamp: string | Date;
  reason: string;
}

export interface SharedKpiAlignmentItem {
  id: string;
  title: string;
  weightage: number;
  progress: number;
}

export interface EmployeeAnalyticsData {
  personalScore: number;
  goalsCount: number;
  completedCount: number;
  onTrackCount: number;
  notStartedCount: number;
  managerName: string;
  managerFeedbackTimeline: FeedbackTimelineItem[];
  sharedKpiAlignments: SharedKpiAlignmentItem[];
  trends: QoQTrendPoint[];
}

export interface AdminAnalyticsData {
  overallCompletionRate: number;
  completedCount: number;
  pendingReviewCount: number;
  draftCount: number;
  totalEmployees: number;
  departmentCompletions: DepartmentCompletion[];
  thrustAreas: ThrustAreaDistribution[];
  uomTypes: UomDistribution[];
  managerPerformances: ManagerPerformance[];
  trends: QoQTrendPoint[];
}

export interface ManagerAnalyticsData {
  teamSize: number;
  completedSheets: number;
  submittedSheets: number;
  draftSheets: number;
  teamCompletionRate: number;
  memberProgress: MemberProgressItem[];
  sharedKpis: SharedKpiItem[];
  trends: QoQTrendPoint[];
  personalExecution: EmployeeAnalyticsData;
}

// -----------------------------------------------------------------
// SVG Line Chart Component
// -----------------------------------------------------------------
export function SvgLineChart({ data }: { data: { quarter: string; avgProgress: number }[] }) {
  const width = 500;
  const height = 150;
  const padding = 24;
  
  const points = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
    const y = height - padding - (d.avgProgress * (height - 2 * padding)) / 100;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="w-full bg-zinc-950 p-5 rounded-xl border border-zinc-900 select-none">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp size={14} className="text-blue-400" /> Quarter-over-Quarter Performance Trend
        </h4>
        <span className="text-[10px] text-zinc-650 uppercase font-bold tracking-wider">Average Progress Rate (%)</span>
      </div>
      <div className="relative h-[140px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {[0, 25, 50, 75, 100].map((val) => {
            const y = height - padding - (val * (height - 2 * padding)) / 100;
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#18181b" strokeWidth="1" strokeDasharray="3 3" />
                <text x={padding - 6} y={y + 3} fill="#52525b" fontSize="8" textAnchor="end" fontFamily="monospace" fontWeight="bold">{val}%</text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaD && <path d={areaD} fill="url(#chartGrad)" />}
          {pathD && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="#09090b" strokeWidth="1.5" />
              <circle cx={p.x} cy={p.y} r="8" fill="#3b82f6" className="opacity-0 hover:opacity-10 transition-opacity" />
              <text x={p.x} y={p.y - 10} fill="#f4f4f5" fontSize="8" fontWeight="bold" textAnchor="middle" className="hidden group-hover:block font-mono bg-zinc-950 px-1 py-0.5 rounded">{p.avgProgress}%</text>
              <text x={p.x} y={height - 4} fill="#71717a" fontSize="8" textAnchor="middle" fontWeight="bold" className="uppercase tracking-wider">{p.quarter}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// SVG Donut Chart Component
// -----------------------------------------------------------------
export function SvgDonutChart({ data, title }: { data: { label: string; count: number; color: string }[]; title: string }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedAngle = 0;
  
  const slices = data.map((item) => {
    const percentage = total > 0 ? item.count / total : 0;
    const strokeDashoffset = circumference - percentage * circumference;
    const strokeDasharray = `${circumference} ${circumference}`;
    const rotation = accumulatedAngle * 360;
    accumulatedAngle += percentage;
    
    return {
      ...item,
      strokeDashoffset,
      strokeDasharray,
      rotation,
      percentage: Math.round(percentage * 100)
    };
  });

  return (
    <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-900 flex items-center justify-between gap-6 select-none">
      <div className="flex-1 min-w-0">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">{title}</h4>
        <div className="space-y-2">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] font-semibold">
              <div className="flex items-center gap-1.5 text-zinc-400 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                <span className="truncate">{slice.label}</span>
              </div>
              <span className="font-mono text-zinc-600 font-bold ml-2">{slice.count} ({slice.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {total === 0 ? (
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#18181b" strokeWidth={strokeWidth} />
          ) : (
            slices.map((slice, i) => (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                style={{
                  transformOrigin: "center",
                  transform: `rotate(${slice.rotation}deg)`,
                  transition: "stroke-dashoffset 0.5s ease"
                }}
              />
            ))
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-bold text-zinc-300 font-mono">{total}</span>
          <span className="text-[8px] text-zinc-650 uppercase tracking-wider font-bold">Total</span>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// UI MAIN WRAPPER
// -----------------------------------------------------------------
export function AnalyticsDashboard({ 
  role, 
  data 
}: { 
  role: "ADMIN" | "MANAGER" | "EMPLOYEE"; 
  data: any; 
}) {
  const [managerView, setManagerView] = useState<"team" | "personal">("team");

  return (
    <div className="space-y-8 select-none">
      {/* 1. ADMIN GOVERNANCE VIEWER */}
      {role === "ADMIN" && (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
          {/* Mini Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-zinc-950 text-zinc-400 border border-zinc-900 rounded-lg"><Users size={16} /></div>
              <div>
                <p className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Consensus Compliance</p>
                <p className="text-xl font-extrabold text-zinc-150 font-mono mt-0.5">{data.overallCompletionRate}%</p>
              </div>
            </div>
            <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-lg"><CheckCircle2 size={16} /></div>
              <div>
                <p className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Finalized Plans</p>
                <p className="text-xl font-extrabold text-emerald-450 font-mono mt-0.5">{data.completedCount}</p>
              </div>
            </div>
            <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-amber-500/10 text-amber-450 border border-amber-500/20 rounded-lg"><AlertTriangle size={16} /></div>
              <div>
                <p className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Awaiting Approval</p>
                <p className="text-xl font-extrabold text-amber-450 font-mono mt-0.5">{data.pendingReviewCount}</p>
              </div>
            </div>
            <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-blue-500/10 text-blue-450 border border-blue-500/20 rounded-lg"><Hourglass size={16} /></div>
              <div>
                <p className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">In Planning Workspace</p>
                <p className="text-xl font-extrabold text-blue-450 font-mono mt-0.5">{data.draftCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Trend line chart */}
            <div className="lg:col-span-2 space-y-6">
              <SvgLineChart data={data.trends} />
              
              {/* Department Completion Heatmap */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Building2 size={14} className="text-zinc-500" /> Department Completion Matrix
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.departmentCompletions.map((dept: DepartmentCompletion) => (
                    <div key={dept.id} className="p-4 bg-zinc-950/20 rounded-xl border border-zinc-900 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-zinc-300 truncate">{dept.name}</span>
                        <span className="font-mono font-bold text-blue-400">{dept.percentage}%</span>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${dept.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-550 font-semibold">
                          <span>{dept.completedSheets} of {dept.totalEmployees} locked</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Goal Distribution */}
            <div className="space-y-6">
              <SvgDonutChart 
                title="Thrust Area Priorities" 
                data={data.thrustAreas.slice(0, 4).map((ta: ThrustAreaDistribution, idx: number) => ({
                  label: ta.thrustArea,
                  count: ta.count,
                  color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][idx % 4]
                }))} 
              />
              <SvgDonutChart 
                title="Success Metric Types" 
                data={data.uomTypes.map((u: UomDistribution, idx: number) => ({
                  label: u.uomType === "NUMERIC" ? "Numeric" : u.uomType === "PERCENTAGE" ? "Percentage" : "Zero-Based",
                  count: u.count,
                  color: ["#6366f1", "#14b8a6", "#f43f5e", "#ec4899"][idx % 4]
                }))} 
              />
            </div>
          </div>

          {/* Manager Effectiveness */}
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Award size={14} className="text-zinc-500" /> Leadership Consensus Operational Performance
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] font-semibold text-zinc-400">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Manager</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Team size</th>
                    <th className="py-2.5 px-4">Approval speed</th>
                    <th className="py-2.5 px-4">Execution alignment</th>
                    <th className="py-2.5 px-4">Pending action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-950">
                  {data.managerPerformances.map((mgr: ManagerPerformance) => (
                    <tr key={mgr.id} className="hover:bg-zinc-950/20 transition-colors">
                      <td className="py-3 px-4 text-zinc-200 font-bold">{mgr.name}</td>
                      <td className="py-3 px-4 text-zinc-400">{mgr.department}</td>
                      <td className="py-3 px-4 font-mono text-zinc-400">{mgr.teamSize}</td>
                      <td className="py-3 px-4 font-mono text-zinc-300">~{mgr.avgTurnaroundHours} hrs</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-300">{mgr.checkInCompletionRate}%</span>
                          <div className="w-16 bg-zinc-900 h-1 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${mgr.checkInCompletionRate}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {mgr.pendingCount > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-bold text-[9px] uppercase tracking-wider">
                            {mgr.pendingCount} approvals pending
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded font-bold text-[9px] uppercase tracking-wider">
                            Clear Consensus
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGER WORKSPACE AND TEAM VIEWER */}
      {role === "MANAGER" && (
        <div className="space-y-6">
          {/* Dual Role View Selector */}
          <div className="flex border-b border-zinc-900 gap-6 text-xs font-semibold">
            <button 
              onClick={() => setManagerView("team")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                managerView === "team" 
                  ? "border-blue-500 text-zinc-100" 
                  : "border-transparent text-zinc-550 hover:text-zinc-350"
              }`}
              type="button"
            >
              <Users size={14} /> Team Performance Calibration
            </button>
            <button 
              onClick={() => setManagerView("personal")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                managerView === "personal" 
                  ? "border-blue-500 text-zinc-100" 
                  : "border-transparent text-zinc-550 hover:text-zinc-350"
              }`}
              type="button"
            >
              <Target size={14} /> My Workspace Insights
            </button>
          </div>

          {managerView === "team" ? (
            <div className="space-y-8 animate-in fade-in-50 duration-300">
              {/* Mini Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
                  <div className="p-2.5 bg-zinc-950 text-zinc-400 border border-zinc-900 rounded-lg"><Users size={16} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Team size</p>
                    <p className="text-xl font-extrabold text-zinc-150 font-mono mt-0.5">{data.teamSize}</p>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-lg"><CheckCircle2 size={16} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Finalized Plans</p>
                    <p className="text-xl font-extrabold text-emerald-450 font-mono mt-0.5">{data.completedSheets}</p>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
                  <div className="p-2.5 bg-amber-500/10 text-amber-450 border border-amber-500/20 rounded-lg"><AlertTriangle size={16} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">Awaiting Approval</p>
                    <p className="text-xl font-extrabold text-amber-450 font-mono mt-0.5">{data.submittedSheets}</p>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
                  <div className="p-2.5 bg-blue-500/10 text-blue-450 border border-blue-500/20 rounded-lg"><Hourglass size={16} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider">In Planning Workspace</p>
                    <p className="text-xl font-extrabold text-blue-450 font-mono mt-0.5">{data.draftSheets}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Team progression chart */}
                <div className="lg:col-span-2 space-y-6">
                  <SvgLineChart data={data.trends} />
                  
                  {/* Direct Report Performance Matrix */}
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Users size={14} className="text-zinc-500" /> Team Progress Calibration
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px] font-semibold text-zinc-405">
                        <thead>
                          <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Team member</th>
                            <th className="py-2.5 px-3">Emp ID</th>
                            <th className="py-2.5 px-3">Quarter plan status</th>
                            <th className="py-2.5 px-3">Objectives defined</th>
                            <th className="py-2.5 px-3">Alignment progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-950">
                          {data.memberProgress.map((member: MemberProgressItem) => (
                            <tr key={member.id} className="hover:bg-zinc-950/20 transition-colors">
                              <td className="py-3 px-3 text-zinc-200 font-bold">{member.name}</td>
                              <td className="py-3 px-3 text-zinc-400 font-mono">{member.empId}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                  member.sheetStatus === "LOCKED" || member.sheetStatus === "APPROVED" 
                                    ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" 
                                    : member.sheetStatus === "SUBMITTED" || member.sheetStatus === "UNDER_REVIEW"
                                    ? "bg-amber-500/10 text-amber-455 border-amber-500/20"
                                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                                }`}>
                                  {member.sheetStatus === "APPROVED" || member.sheetStatus === "LOCKED" ? "Finalized" : member.sheetStatus.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-zinc-400">{member.goalsCount} goals</td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-zinc-300">{member.avgProgress}%</span>
                                  <div className="w-16 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: `${member.avgProgress}%` }}></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right: Shared KPI Cascade Progress */}
                <div className="space-y-6">
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Target size={14} className="text-zinc-500" /> Cascaded Organizational Targets
                    </h4>
                    {data.sharedKpis.length === 0 ? (
                      <p className="text-xs text-zinc-550 text-center py-6 italic">No cascading master shared KPIs configured.</p>
                    ) : (
                      <div className="space-y-4">
                        {data.sharedKpis.map((sk: SharedKpiItem) => (
                          <div key={sk.id} className="p-4 bg-zinc-950/20 rounded-xl border border-zinc-900 flex flex-col gap-3">
                            <div>
                              <span className="text-xs font-bold text-zinc-350">{sk.title}</span>
                              <p className="text-[10px] text-zinc-550 font-semibold mt-0.5">Target: {sk.targetValue} ({sk.uomType === "NUMERIC" ? "Numeric" : sk.uomType === "PERCENTAGE" ? "Percentage" : "Zero-Based"})</p>
                            </div>
                            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full" style={{ width: `${sk.avgProgress}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold text-zinc-550 uppercase tracking-wider">
                              <span>Cascaded to {sk.cascadeCount} employees</span>
                              <span className="font-mono text-zinc-400">Avg: {sk.avgProgress}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Manager Personal View */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-300">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <SvgLineChart data={data.personalExecution.trends} />
                
                {/* Feedback Timeline */}
                <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Calendar size={14} className="text-zinc-500" /> Workflow Consensus Events
                  </h4>
                  {data.personalExecution.managerFeedbackTimeline.length === 0 ? (
                    <div className="text-center py-8 text-zinc-550 text-xs italic">No workflow consensus events recorded yet.</div>
                  ) : (
                    <div className="relative border-l border-zinc-900 pl-4 ml-2 space-y-6">
                      {data.personalExecution.managerFeedbackTimeline.map((item: FeedbackTimelineItem) => (
                        <div key={item.id} className="relative">
                          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-500 border border-zinc-950"></span>
                          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                            <span className="text-zinc-250 font-bold uppercase tracking-wide text-[10px]">{item.action.replace('_', ' ')}</span>
                            <span className="font-mono text-[9px] text-zinc-500 font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>
                          {item.reason && (
                            <p className="text-[11px] text-zinc-500 mt-1 italic leading-relaxed">"{item.reason}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Goal Score Donut */}
                <SvgDonutChart 
                  title="Thrust Focus Distribution" 
                  data={[
                    { label: "Completed", count: data.personalExecution.completedCount, color: "#10b981" },
                    { label: "On Track", count: data.personalExecution.onTrackCount, color: "#3b82f6" },
                    { label: "Not Started", count: data.personalExecution.notStartedCount, color: "#71717a" }
                  ]}
                />

                {/* Contribution to Shared departmental goals */}
                <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Target size={14} className="text-zinc-500" /> Cascaded Target Allocations
                  </h4>
                  {data.personalExecution.sharedKpiAlignments.length === 0 ? (
                    <p className="text-xs text-zinc-550 text-center py-6 italic">No cascaded target allocations currently assigned.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.personalExecution.sharedKpiAlignments.map((ka: SharedKpiAlignmentItem) => (
                        <div key={ka.id} className="p-3 bg-zinc-950/20 border border-zinc-900 rounded-xl flex flex-col gap-2">
                          <div className="flex justify-between items-start text-xs font-bold">
                            <span className="text-zinc-300 line-clamp-1">{ka.title}</span>
                            <span className="font-mono text-[9px] text-zinc-550 font-bold shrink-0 ml-2">{ka.weightage}% weight</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${ka.progress}%` }}></div>
                          </div>
                          <div className="flex justify-end text-[9px] text-zinc-550 font-bold uppercase tracking-wider">
                            <span className="font-mono">{ka.progress}% contribution progress</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. EMPLOYEE PERSONAL INSIGHTS */}
      {role === "EMPLOYEE" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-300">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <SvgLineChart data={data.trends} />
            
            {/* Feedback Timeline */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Calendar size={14} className="text-zinc-500" /> Workflow Consensus Events
              </h4>
              {data.managerFeedbackTimeline.length === 0 ? (
                <div className="text-center py-8 text-zinc-550 text-xs italic">No workflow consensus events recorded yet.</div>
              ) : (
                <div className="relative border-l border-zinc-800 pl-4 ml-2 space-y-6">
                  {data.managerFeedbackTimeline.map((item: FeedbackTimelineItem) => (
                    <div key={item.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-500 border border-zinc-950"></span>
                      <div className="flex items-center justify-between text-xs text-zinc-450 font-bold uppercase tracking-wider text-[10px]">
                        <span>{item.action.replace('_', ' ')}</span>
                        <span className="font-mono text-[9px] text-zinc-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      {item.reason && (
                        <p className="text-[11px] text-zinc-500 mt-1 italic leading-relaxed">"{item.reason}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Goal Score Donut */}
            <SvgDonutChart 
              title="Thrust Focus Distribution" 
              data={[
                { label: "Completed", count: data.completedCount, color: "#10b981" },
                { label: "On Track", count: data.onTrackCount, color: "#3b82f6" },
                { label: "Not Started", count: data.notStartedCount, color: "#71717a" }
              ]}
            />

            {/* Contribution to Shared departmental goals */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Target size={14} className="text-zinc-500" /> Cascaded Target Allocations
              </h4>
              {data.sharedKpiAlignments.length === 0 ? (
                <p className="text-xs text-zinc-550 text-center py-6 italic">No cascaded target allocations currently assigned.</p>
              ) : (
                <div className="space-y-3">
                  {data.sharedKpiAlignments.map((ka: SharedKpiAlignmentItem) => (
                    <div key={ka.id} className="p-3 bg-zinc-950/20 border border-zinc-900 rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-start text-xs font-bold">
                        <span className="text-zinc-300 line-clamp-1">{ka.title}</span>
                        <span className="font-mono text-[9px] text-zinc-550 font-bold shrink-0 ml-2">{ka.weightage}% weight</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${ka.progress}%` }}></div>
                      </div>
                      <div className="flex justify-end text-[9px] font-bold text-zinc-550 uppercase tracking-wider">
                        <span className="font-mono">{ka.progress}% contribution progress</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
