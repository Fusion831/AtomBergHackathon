"use client";

import { useState, useTransition } from "react";
import { assignSharedGoal } from "@/app/actions/sharedGoalActions";
import { User } from "@prisma/client";
import { UserPlus, X } from "lucide-react";

export function AssignSharedGoalModal({ 
  goalId, 
  teamMembers, 
  assignedIds,
  cycleId 
}: { 
  goalId: string; 
  teamMembers: User[]; 
  assignedIds: string[];
  cycleId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const unassignedMembers = teamMembers.filter(m => !assignedIds.includes(m.id));

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAssign = () => {
    if (selectedIds.size === 0) return;
    
    startTransition(async () => {
      const res = await assignSharedGoal(goalId, Array.from(selectedIds), cycleId);
      if (res.success) {
        setIsOpen(false);
        setSelectedIds(new Set());
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
      >
        <UserPlus size={14} /> Assign to Team
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/80">
              <h3 className="text-lg font-medium text-zinc-100">Assign Shared KPI</h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {unassignedMembers.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">All your team members have already been assigned this goal, or you have no team members.</p>
              ) : (
                <div className="space-y-2">
                  {unassignedMembers.map(member => (
                    <label key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(member.id)}
                        onChange={() => toggleSelection(member.id)}
                        className="w-4 h-4 rounded border-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-900 bg-zinc-900"
                      />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{member.name}</p>
                        <p className="text-xs text-zinc-500">{member.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssign}
                disabled={selectedIds.size === 0 || isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-md transition-colors"
              >
                {isPending ? "Assigning..." : `Assign to ${selectedIds.size} employees`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
