import { format, isToday, isYesterday } from "date-fns";
import { FileText, CheckCircle, XCircle, Unlock, Play, GitBranch, Target, Settings, Activity } from "lucide-react";

export interface FormattedAudit {
  id: string;
  actorName: string;
  actionText: string;
  entityName: string;
  timestamp: string;
  timeRaw: Date;
  icon: React.ElementType;
  iconColor: string;
}

export function formatAuditAction(action: string, entityType: string, newValues: any): { text: string, icon: React.ElementType, color: string } {
  switch (action) {
    case "SUBMIT_SHEET":
      return { text: "submitted their Goal Sheet for review", icon: FileText, color: "text-blue-400 bg-blue-500/10" };
    case "MANAGER_APPROVE":
    case "APPROVE_SHEET":
      return { text: "approved the Goal Sheet", icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10" };
    case "MANAGER_REJECT":
    case "REJECT_SHEET":
      return { text: "requested revisions on the Goal Sheet", icon: XCircle, color: "text-rose-400 bg-rose-500/10" };
    case "ADMIN_UNLOCK_SHEET":
      return { text: `unlocked Goal Sheet (Override: ${newValues?.reason || "No reason"})`, icon: Unlock, color: "text-amber-400 bg-amber-500/10" };
    case "REQUEST_UNLOCK":
      return { text: `requested an unlock for their Goal Sheet: "${newValues?.reason || "No reason"}"`, icon: Unlock, color: "text-amber-400 bg-amber-500/10" };
    case "CREATE_CYCLE":
      return { text: `created goal cycle "${newValues?.name}"`, icon: Settings, color: "text-zinc-400 bg-zinc-500/10" };
    case "SET_ACTIVE_CYCLE":
      return { text: "activated a goal cycle", icon: Play, color: "text-emerald-400 bg-emerald-500/10" };
    case "SET_ACTIVE_QUARTER":
      return { text: `opened check-in window for ${newValues?.activeQuarter || "Goal Setting"}`, icon: Target, color: "text-blue-400 bg-blue-500/10" };
    case "CREATE_SHARED_GOAL":
      return { text: `created shared KPI "${newValues?.title}"`, icon: Target, color: "text-indigo-400 bg-indigo-500/10" };
    case "ASSIGN_SHARED_GOAL":
      return { text: "assigned a cascading KPI to a team member", icon: GitBranch, color: "text-indigo-400 bg-indigo-500/10" };
    case "CREATE_CHECKIN":
    case "UPDATE_CHECKIN":
      return { text: `logged a progress update`, icon: Activity, color: "text-emerald-400 bg-emerald-500/10" };
    case "PROPAGATE_CHECKIN":
      return { text: "automatically synced cascaded progress", icon: GitBranch, color: "text-zinc-400 bg-zinc-500/10" };
    case "MANAGER_COMMENT_CHECKIN":
      return { text: "added a review comment on a check-in", icon: FileText, color: "text-blue-400 bg-blue-500/10" };
    default:
      return { text: `updated ${entityType.toLowerCase()}`, icon: Activity, color: "text-zinc-400 bg-zinc-800" };
  }
}

export function formatAuditTimestamp(date: Date) {
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy');
}

export function groupAuditsByDate(audits: any[]) {
  const groups: { [key: string]: any[] } = {};
  audits.forEach(audit => {
    let dateStr = "Older";
    if (isToday(audit.createdAt)) dateStr = "Today";
    else if (isYesterday(audit.createdAt)) dateStr = "Yesterday";
    else dateStr = format(audit.createdAt, 'MMMM d, yyyy');

    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(audit);
  });
  return groups;
}
