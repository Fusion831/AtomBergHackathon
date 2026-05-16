"use client";

import { GoalInput, GoalSchema } from "@/lib/validations/goal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { saveGoal } from "@/app/actions/goalActions";
import { useTransition } from "react";
import { UomType } from "@prisma/client";
import { Users } from "lucide-react";

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
    resolver: zodResolver(GoalSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      thrustArea: initialData?.thrustArea || "",
      uomType: initialData?.uomType || UomType.NUMERIC,
      targetValue: initialData?.targetValue || null,
      weightage: initialData?.weightage || 10,
    }
  });

  const onSubmit = (data: GoalInput) => {
    startTransition(async () => {
      // If it's a shared goal, we only allow updating weightage. 
      // The backend should also strictly enforce this, but we'll send it down.
      // We pass the id if it exists so saveGoal knows it's an update.
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
    <form onSubmit={form.handleSubmit(onSubmit)} className={`flex flex-col gap-5 p-6 bg-zinc-950 border ${isShared ? 'border-blue-500/30' : 'border-zinc-800'} rounded-xl relative`}>
      <div className="space-y-1">
        <h2 className="text-lg font-medium text-blue-400">
          {initialData ? (isShared ? "Adjust Shared KPI Weightage" : "Edit Goal") : "Draft New Goal"}
        </h2>
        {isShared ? (
          <p className="text-sm text-blue-400/80 flex items-center gap-1.5 mt-1">
            <Users size={14} /> This is a shared departmental goal. You can only adjust its weightage.
          </p>
        ) : (
          <p className="text-sm text-zinc-400">Define your objective and how you'll measure success.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-medium text-zinc-300">Goal Title</label>
          <input 
            {...form.register("title")}
            disabled={isShared}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
            placeholder="e.g., Increase Q3 Sales Revenue" 
          />
          {form.formState.errors.title && <span className="text-xs text-rose-400">{form.formState.errors.title.message}</span>}
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-medium text-zinc-300">Description (Optional)</label>
          <textarea 
            {...form.register("description")}
            disabled={isShared}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none disabled:opacity-50 disabled:cursor-not-allowed" 
            placeholder="Provide clarity on how this will be achieved..." 
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-300">Thrust Area</label>
          <select 
            {...form.register("thrustArea")}
            disabled={isShared}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select an area...</option>
            <option value="Financial">Financial Performance</option>
            <option value="Customer">Customer Satisfaction</option>
            <option value="Process">Operational Excellence</option>
            <option value="People">People & Culture</option>
          </select>
          {form.formState.errors.thrustArea && <span className="text-xs text-rose-400">{form.formState.errors.thrustArea.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-amber-400">Weightage (%) *</label>
          <input 
            type="number"
            {...form.register("weightage")}
            className="px-3 py-2 bg-zinc-900 border border-amber-500/30 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-amber-500" 
            placeholder="min 10%" 
          />
          {form.formState.errors.weightage && <span className="text-xs text-rose-400">{form.formState.errors.weightage.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-300">Unit of Measure (UoM)</label>
          <select 
            {...form.register("uomType")}
            disabled={isShared}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="NUMERIC">Numeric</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="TIMELINE">Timeline / Date</option>
            <option value="ZERO_BASED">Zero-Based (Defect rate)</option>
          </select>
        </div>

        {uom !== "TIMELINE" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Target Value</label>
            <input 
              type="number" step="any"
              {...form.register("targetValue")}
              disabled={isShared}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
              placeholder="Target amount..." 
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
        >
          {isPending ? "Saving..." : initialData ? "Update Goal" : "Add Goal"}
        </button>
      </div>
    </form>
  );
}
