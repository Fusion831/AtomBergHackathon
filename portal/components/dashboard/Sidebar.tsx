"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Target, 
  FileText, 
  Activity, 
  TrendingUp, 
  CheckCircle, 
  Users, 
  Compass, 
  Lock, 
  LogOut, 
  Menu, 
  X,
  User,
  FileSpreadsheet
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import Link from "next/link";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  activeQuarter: string | null | undefined;
  planningQuarter: string | null | undefined;
}

export function Sidebar({ user, activeQuarter, planningQuarter }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  };

  const isManagerOrAdmin = user.role === "MANAGER" || user.role === "ADMIN";
  const isAdmin = user.role === "ADMIN";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "MANAGER":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-900 w-64 text-zinc-400 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-900 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
            <Target size={20} className="text-blue-400" />
          </div>
          <span className="text-lg font-bold text-zinc-100 tracking-tight group-hover:text-white transition-colors">AtomQuest</span>
        </Link>
        <button 
          onClick={() => setIsOpen(false)} 
          className="md:hidden p-1 hover:bg-zinc-900 rounded text-zinc-500 hover:text-zinc-300"
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-900">
        {/* Workspace Section */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider px-3 mb-2">My Work</div>
          
          <Link 
            href="/goals/draft"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive("/goals/draft") 
                ? "bg-zinc-900 text-zinc-100 border border-zinc-800" 
                : "hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <FileText size={16} className={isActive("/goals/draft") ? "text-blue-400" : "text-zinc-500"} />
            <span>Quarter Plan</span>
          </Link>

          <Link 
            href="/checkins"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive("/checkins") 
                ? "bg-zinc-900 text-zinc-100 border border-zinc-800" 
                : "hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <Activity size={16} className={isActive("/checkins") ? "text-blue-400" : "text-zinc-500"} />
            <span>Performance Updates</span>
          </Link>

          <Link 
            href="/reports?tab=insights"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive("/reports") && !pathname.includes("tab=exports")
                ? "bg-zinc-900 text-zinc-100 border border-zinc-800" 
                : "hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <TrendingUp size={16} className={isActive("/reports") && !pathname.includes("tab=exports") ? "text-blue-400" : "text-zinc-500"} />
            <span>Performance Insights</span>
          </Link>

          {isManagerOrAdmin && (
            <Link 
              href="/reports?tab=exports"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                pathname.includes("tab=exports") 
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-800" 
                  : "hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <FileSpreadsheet size={16} className={pathname.includes("tab=exports") ? "text-blue-400" : "text-zinc-500"} />
              <span>Corporate Reports</span>
            </Link>
          )}
        </div>

        {/* Team Governance Section */}
        {isManagerOrAdmin && (
          <div className="space-y-1.5 pt-4 border-t border-zinc-900">
            <div className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider px-3 mb-2">Team Leadership</div>
            
            <Link 
              href="/manager/review"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive("/manager/review") 
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-800" 
                  : "hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <CheckCircle size={16} className={isActive("/manager/review") ? "text-blue-400" : "text-zinc-500"} />
              <span>Manager Approvals</span>
            </Link>

            <Link 
              href="/manager/checkins"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive("/manager/checkins") 
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-800" 
                  : "hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Users size={16} className={isActive("/manager/checkins") ? "text-blue-400" : "text-zinc-500"} />
              <span>Team Performance Updates</span>
            </Link>

            <Link 
              href="/manager/shared-goals"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive("/manager/shared-goals") 
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-800" 
                  : "hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Target size={16} className={isActive("/manager/shared-goals") ? "text-blue-400" : "text-zinc-500"} />
              <span>Cascaded Team Goals</span>
            </Link>
          </div>
        )}

        {/* Administration Section */}
        {isAdmin && (
          <div className="space-y-1.5 pt-4 border-t border-zinc-900">
            <div className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider px-3 mb-2">Operations Control</div>
            
            <Link 
              href="/admin/governance"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive("/admin/governance") 
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-800" 
                  : "hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Lock size={16} className={isActive("/admin/governance") ? "text-amber-450" : "text-zinc-500"} />
              <span>Operations Center</span>
            </Link>

            <Link 
              href="/directory"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive("/directory") 
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-800" 
                  : "hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Compass size={16} className={isActive("/directory") ? "text-blue-400" : "text-zinc-500"} />
              <span>Directory</span>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom User Card */}
      <div className="p-4 border-t border-zinc-900 shrink-0 bg-zinc-950/80">
        <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user.name}</p>
              <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider border ${getRoleBadge(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-900">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Hamburger Header */}
      <header className="md:hidden bg-zinc-950 border-b border-zinc-900 px-6 py-4 flex items-center justify-between shrink-0 w-full z-45">
        <Link href="/" className="flex items-center gap-2">
          <Target size={18} className="text-blue-400" />
          <span className="text-sm font-bold text-zinc-100 tracking-tight">AtomQuest</span>
        </Link>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-zinc-200"
          type="button"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          
          {/* Slider */}
          <div className="relative z-10 w-64 h-full animate-slide-right">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
