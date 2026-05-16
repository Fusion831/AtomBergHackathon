import { CheckCircle2, CircleDashed, AlertCircle } from "lucide-react";

export function WeightageProgress({ current }: { current: number }) {
  const isComplete = current === 100;
  const isOver = current > 100;
  
  return (
    <div className="flex flex-col gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300">Target Weightage</h3>
        <span className={`text-sm font-bold ${isComplete ? "text-emerald-400" : isOver ? "text-rose-400" : "text-amber-400"}`}>
          {current} / 100%
        </span>
      </div>
      
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
        <div 
          className={`h-full transition-all duration-500 ${isComplete ? "bg-emerald-500" : isOver ? "bg-rose-500" : "bg-amber-500"}`}
          style={{ width: `${Math.min(current, 100)}%` }}
        />
      </div>

      <div className="flex items-start gap-2 text-xs text-zinc-400 mt-1">
        {isComplete ? (
          <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span>Perfect. Your weightage totals exactly 100%. You are ready to submit.</span></>
        ) : isOver ? (
          <><AlertCircle className="w-4 h-4 text-rose-400" /> <span>You are over the 100% limit by {current - 100}%. Please reduce weights.</span></>
        ) : (
          <><CircleDashed className="w-4 h-4 text-amber-400" /> <span>You need {100 - current}% more weightage before you can submit your goals.</span></>
        )}
      </div>
    </div>
  );
}
