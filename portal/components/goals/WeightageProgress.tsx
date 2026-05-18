import { CheckCircle2, CircleDashed, AlertCircle } from "lucide-react";

export function WeightageProgress({ current }: { current: number }) {
  const isComplete = current === 100;
  const isOver = current > 100;
  
  return (
    <div className="flex flex-col gap-2.5 p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl select-none">
      <div className="flex items-center justify-between text-xs">
        <h3 className="font-semibold text-zinc-450 uppercase tracking-wider">Total Contribution</h3>
        <span className={`font-bold font-mono ${isComplete ? "text-emerald-400" : isOver ? "text-rose-400" : "text-amber-400"}`}>
          {current} / 100%
        </span>
      </div>
      
      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
        <div 
          className={`h-full transition-all duration-500 ${isComplete ? "bg-emerald-500" : isOver ? "bg-rose-500" : "bg-amber-500"}`}
          style={{ width: `${Math.min(current, 100)}%` }}
        />
      </div>

      <div className="flex items-start gap-2 text-[10px] text-zinc-550 leading-relaxed">
        {isComplete ? (
          <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> <span>Valid contribution balance. Ready for submission.</span></>
        ) : isOver ? (
          <><AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" /> <span>Exceeds limit by {current - 100}%. Decrease goal allocations.</span></>
        ) : (
          <><CircleDashed className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 animate-spin" /> <span>Requires {100 - current}% more contribution allocation to submit.</span></>
        )}
      </div>
    </div>
  );
}
