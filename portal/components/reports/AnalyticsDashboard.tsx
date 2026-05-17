"use client";

import { useState } from "react";
import { 
  TrendingUp, Users, Target, CheckCircle2, AlertTriangle, 
  Hourglass, Building2, ShieldAlert, Award, Calendar, FileSpreadsheet 
} from "lucide-react";
import { UomType } from "@prisma/client";

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
    <div className="w-full bg-zinc-950 p-5 rounded-xl border border-zinc-800/80">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-400" /> Quarter-over-Quarter Performance
        </h4>
        <span className="text-xs text-zinc-500 font-mono">Average Goal Progress (%)</span>
      </div>
      <div className="relative h-[160px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {[0, 25, 50, 75, 100].map((val) => {
            const y = height - padding - (val * (height - 2 * padding)) / 100;
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding - 6} y={y + 4} fill="#71717a" fontSize="8" textAnchor="end" fontFamily="monospace">{val}%</text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaD && <path d={areaD} fill="url(#chartGrad)" />}
          {pathD && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="#09090b" strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="8" fill="#3b82f6" className="opacity-0 hover:opacity-20 transition-opacity" />
              <text x={p.x} y={p.y - 10} fill="#f4f4f5" fontSize="9" fontWeight="600" textAnchor="middle" className="hidden group-hover:block font-mono bg-zinc-950 px-1 py-0.5 rounded">{p.avgProgress}%</text>
              <text x={p.x} y={height - 4} fill="#71717a" fontSize="9" textAnchor="middle" fontWeight="500">{p.quarter}</text>
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
  const size = 120;
  const strokeWidth = 12;
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
    <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-6">
      <div className="flex-1">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{title}</h4>
        <div className="space-y-2">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                <span className="truncate max-w-[120px]">{slice.label}</span>
              </div>
              <span className="font-mono text-zinc-500 font-semibold">{slice.count} ({slice.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {total === 0 ? (
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#27272a" strokeWidth={strokeWidth} />
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
          <span className="text-lg font-bold text-zinc-100 font-mono">{total}</span>
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Total</span>
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
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. ADMIN GOVERNANCE VIEWER */}
      {role === "ADMIN" && (
        <div className="space-y-8">
          {/* Mini Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Users size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Compliance Rate</p>
                <p className="text-2xl font-bold text-zinc-100">{data.overallCompletionRate}%</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><CheckCircle2 size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Sheets Approved</p>
                <p className="text-2xl font-bold text-zinc-100">{data.completedCount}</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><AlertTriangle size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Pending L1 Review</p>
                <p className="text-2xl font-bold text-zinc-100">{data.pendingReviewCount}</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-zinc-800 text-zinc-400 rounded-lg"><Hourglass size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Remaining in Draft</p>
                <p className="text-2xl font-bold text-zinc-100">{data.draftCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Trend line chart */}
            <div className="lg:col-span-2 space-y-6">
              <SvgLineChart data={data.trends} />
              
              {/* Department Completion Heatmap */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                  <Building2 size={16} className="text-zinc-400" /> Department Completion Matrix
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.departmentCompletions.map((dept: any) => (
                    <div key={dept.id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-300 truncate max-w-[150px]">{dept.name}</span>
                        <span className="font-mono text-xs font-bold text-blue-400">{dept.percentage}%</span>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${dept.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-500">
                          <span>{dept.completedSheets} of {dept.totalEmployees} employees locked</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Goal Distribution (Thrust areas, UOMs) */}
            <div className="space-y-6">
              <SvgDonutChart 
                title="Thrust Area Focus" 
                data={data.thrustAreas.slice(0, 4).map((ta: any, idx: number) => ({
                  label: ta.thrustArea,
                  count: ta.count,
                  color: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899"][idx % 4]
                }))} 
              />
              <SvgDonutChart 
                title="Measurement Units" 
                data={data.uomTypes.map((u: any, idx: number) => ({
                  label: u.uomType.replace('_', ' '),
                  count: u.count,
                  color: ["#8b5cf6", "#6366f1", "#f43f5e", "#14b8a6"][idx % 4]
                }))} 
              />
            </div>
          </div>

          {/* Manager Effectiveness */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Award size={16} className="text-zinc-400" /> L1 Manager Effectiveness & Speed Metrics
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Manager</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Team Size</th>
                    <th className="py-2.5 px-4">Turnaround Avg</th>
                    <th className="py-2.5 px-4">Submission Rate</th>
                    <th className="py-2.5 px-4">Status indicators</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {data.managerPerformances.map((mgr: any) => (
                    <tr key={mgr.id} className="hover:bg-zinc-950/40 transition-colors">
                      <td className="py-3 px-4 text-zinc-200 font-medium">{mgr.name}</td>
                      <td className="py-3 px-4 text-zinc-400">{mgr.department}</td>
                      <td className="py-3 px-4 font-mono text-zinc-400">{mgr.teamSize}</td>
                      <td className="py-3 px-4 font-mono text-zinc-300">~{mgr.avgTurnaroundHours} hrs</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-300">{mgr.checkInCompletionRate}%</span>
                          <div className="w-16 bg-zinc-800 h-1 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${mgr.checkInCompletionRate}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {mgr.pendingCount > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded font-semibold text-[10px] uppercase">
                            {mgr.pendingCount} pending reviews
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-semibold text-[10px] uppercase">
                            Fully Approved
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

      {/* 2. L1 MANAGER TEAM VIEWER */}
      {role === "MANAGER" && (
        <div className="space-y-8">
          {/* Mini Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Users size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Team Size</p>
                <p className="text-2xl font-bold text-zinc-100">{data.teamSize}</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><CheckCircle2 size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Approved Sheets</p>
                <p className="text-2xl font-bold text-zinc-100">{data.completedSheets}</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><AlertTriangle size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Submitted (L1)</p>
                <p className="text-2xl font-bold text-zinc-100">{data.submittedSheets}</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-zinc-800 text-zinc-400 rounded-lg"><Hourglass size={20} /></div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Pending Drafts</p>
                <p className="text-2xl font-bold text-zinc-100">{data.draftSheets}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Team progression chart */}
            <div className="lg:col-span-2 space-y-6">
              <SvgLineChart data={data.trends} />
              
              {/* Direct Report Performance Matrix */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                  <Users size={16} className="text-zinc-400" /> Direct Report Completion Matrix
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                        <th className="py-2 px-3">Employee</th>
                        <th className="py-2 px-3">Emp ID</th>
                        <th className="py-2 px-3">Goal Sheet State</th>
                        <th className="py-2 px-3">Goals Count</th>
                        <th className="py-2 px-3">Avg Progress Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {data.memberProgress.map((member: any) => (
                        <tr key={member.id} className="hover:bg-zinc-950/40 transition-colors">
                          <td className="py-3 px-3 text-zinc-200 font-medium">{member.name}</td>
                          <td className="py-3 px-3 text-zinc-400 font-mono">{member.empId}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              member.sheetStatus === "LOCKED" || member.sheetStatus === "APPROVED" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : member.sheetStatus === "SUBMITTED" || member.sheetStatus === "UNDER_REVIEW"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-zinc-800 text-zinc-400"
                            }`}>
                              {member.sheetStatus.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-zinc-400">{member.goalsCount} goals</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-zinc-300">{member.avgProgress}%</span>
                              <div className="w-16 bg-zinc-850 h-1.5 rounded-full overflow-hidden">
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                  <Target size={16} className="text-zinc-400" /> Cascading Master Shared KPIs
                </h4>
                {data.sharedKpis.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">No Master Shared KPIs cascade configured yet.</p>
                ) : (
                  <div className="space-y-4">
                    {data.sharedKpis.map((sk: any) => (
                      <div key={sk.id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 flex flex-col gap-3">
                        <div>
                          <span className="text-xs font-semibold text-zinc-200">{sk.title}</span>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Target: {sk.targetValue} ({sk.uomType})</p>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: `${sk.avgProgress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-zinc-500">
                          <span>Cascaded to {sk.cascadeCount} employees</span>
                          <span className="font-mono text-zinc-400 font-semibold">Avg: {sk.avgProgress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. EMPLOYEE PERSONAL INSIGHTS */}
      {role === "EMPLOYEE" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <SvgLineChart data={data.trends} />
            
            {/* Feedback Timeline */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-zinc-400" /> Goal Sheet Lifecycle & Manager Approvals
              </h4>
              {data.managerFeedbackTimeline.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">No lifecycle timeline events recorded yet.</div>
              ) : (
                <div className="relative border-l border-zinc-800 pl-4 ml-2 space-y-6">
                  {data.managerFeedbackTimeline.map((item: any) => (
                    <div key={item.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-500 border border-zinc-900"></span>
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-semibold text-zinc-200">{item.action.replace('_', ' ')}</span>
                        <span className="font-mono text-[10px] text-zinc-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      {item.reason && (
                        <p className="text-[11px] text-zinc-500 mt-1 italic">"{item.reason}"</p>
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
              title="Personal Goal Status" 
              data={[
                { label: "Completed", count: data.completedCount, color: "#10b981" },
                { label: "On Track", count: data.onTrackCount, color: "#3b82f6" },
                { label: "Not Started", count: data.notStartedCount, color: "#71717a" }
              ]}
            />

            {/* Contribution to Shared departmental goals */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                <Target size={16} className="text-zinc-400" /> Shared KPI Contributions
              </h4>
              {data.sharedKpiAlignments.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">You have no shared KPI contributions currently assigned.</p>
              ) : (
                <div className="space-y-3">
                  {data.sharedKpiAlignments.map((ka: any) => (
                    <div key={ka.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-zinc-300 line-clamp-1">{ka.title}</span>
                        <span className="font-mono text-[10px] text-zinc-500 shrink-0 font-bold ml-2">{ka.weightage}% weight</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${ka.progress}%` }}></div>
                      </div>
                      <div className="flex justify-end text-[10px] text-zinc-500">
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
