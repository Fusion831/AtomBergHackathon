"use client";

import { GoalInput, GoalSchema } from "@/lib/validations/goal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { saveGoal } from "@/app/actions/goalActions";
import { useTransition } from "react";
import { Users, Info, Settings2 } from "lucide-react";

interface GoalFormProps {
  sheetId: string;
  initialData?: Partial<GoalInput> & { id?: string; goalType?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GoalForm({ sheetId, initialData, onSuccess, onCancel }: GoalFormProps) {
  const [isPending, startTransition] = useTransition();
  const isShared = initialData?.goalType === "SHARED";
  
  const form = useForm<GoalInput>({
    resolver: zodResolver(GoalSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      thrustArea: initialData?.thrustArea || "",
      uomType: initialData?.uomType || "NUMERIC",
      metricDirection: initialData?.metricDirection || "HIGHER_IS_BETTER",
      targetValue: initialData?.targetValue || null,
      weightage: initialData?.weightage || 10,
    }
  });

  const onSubmit = (data: GoalInput) => {
    startTransition(async () => {
      const payload = { ...data, id: initialData?.id };
      const res = await saveGoal(payload, sheetId);
      if (res.success) {
        form.reset();
        onSuccess?.();
      } else {
        alert(res.message); 
      }
    });
  };

  const uom = form.watch("uomType");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={`flex flex-col gap-6 p-6 bg-zinc-950 border ${isShared ? 'border-violet-500/20 bg-violet-950/5' : 'border-zinc-900'} rounded-2xl relative shadow-2xl select-none`}>
      <div className="space-y-1">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Settings2 size={18} className="text-blue-400" />
          {initialData ? (isShared ? "Calibrate Cascaded Goal Contribution" : "Modify Goal Details") : "Draft New Performance Goal"}
        </h2>
        {isShared ? (
          <p className="text-xs text-violet-400 flex items-center gap-1.5 mt-1 bg-violet-500/5 px-2.5 py-1.5 border border-violet-500/15 rounded-lg leading-relaxed">
            <Users size={12} className="shrink-0" /> Shared corporate initiative. Goal parameters are locked by alignment; you only specify your local plan contribution.
          </p>
        ) : (
          <p className="text-xs text-zinc-500 leading-relaxed">Specify goal dimensions, align with a performance area, and choose evaluation parameters.</p>
        )}
      </div>

      <div className="space-y-4">
        {/* Step 1: Descriptive Inputs */}
        <div className="space-y-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-350">Goal Name</label>
            <input 
              {...form.register("title")}
              disabled={isShared}
              className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
              placeholder="e.g. Sales Quarter Target Expansion" 
            />
            {form.formState.errors.title && <span className="text-[10px] font-semibold text-rose-450">{form.formState.errors.title.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-350">Description</label>
            <textarea 
              {...form.register("description")}
              disabled={isShared}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-blue-500 h-16 resize-none disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed" 
              placeholder="Clarify specific operational outcomes and actions involved..." 
            />
          </div>
        </div>

        {/* Step 2: Alignment & Contribution */}
        <div className="grid gap-4 grid-cols-2 p-4 bg-zinc-900/30 border border-zinc-900 rounded-xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-350">Thrust Area</label>
            <select 
              {...form.register("thrustArea")}
              disabled={isShared}
              className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="">Align category...</option>
              <option value="Financial">Financial Performance</option>
              <option value="Customer">Customer Satisfaction</option>
              <option value="Process">Operational Excellence</option>
              <option value="People">People & Culture</option>
            </select>
            {form.formState.errors.thrustArea && <span className="text-[10px] font-semibold text-rose-450">{form.formState.errors.thrustArea.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-500">Contribution (%) *</label>
            <input 
              type="number"
              {...form.register("weightage")}
              className="px-3 py-2.5 bg-zinc-900 border border-amber-500/25 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50 font-mono" 
              placeholder="min 10%" 
            />
            {form.formState.errors.weightage && <span className="text-[10px] font-semibold text-rose-450">{form.formState.errors.weightage.message}</span>}
          </div>
        </div>

        {/* Step 3: Success Metrics */}
        <div className="mt-4 pt-4 border-t border-zinc-900/60">
          <div className="flex items-center gap-1.5 mb-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Success Metrics</h3>
            <Info size={12} className="text-zinc-650" />
          </div>
          <div className="grid gap-3.5 md:grid-cols-2 p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Unit of Measure (UoM)</label>
              <select 
                {...form.register("uomType")}
                disabled={isShared}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="NUMERIC">Numeric Value</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="TIMELINE">Timeline / Target Date</option>
                <option value="ZERO_BASED">Zero-Based (Defect minimization)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Metric Direction</label>
              <select 
                {...form.register("metricDirection")}
                disabled={isShared}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="HIGHER_IS_BETTER">Higher is Better (e.g. Performance Increase)</option>
                <option value="LOWER_IS_BETTER">Lower is Better (e.g. Error Rate Decline)</option>
              </select>
            </div>

            {uom !== "TIMELINE" && (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Threshold</label>
                <input 
                  type="number" step="any"
                  {...form.register("targetValue")}
                  disabled={isShared}
                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono" 
                  placeholder="e.g. 100000" 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-zinc-900/60">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-350 transition-colors">
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-900/20"
        >
          {isPending ? "Saving..." : initialData ? "Update Goal" : "Add Goal"}
        </button>
      </div>
    </form>
  );
}
