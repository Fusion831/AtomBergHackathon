"use client";

import { useState, useTransition } from "react";
import { createSharedGoal } from "@/app/actions/sharedGoalActions";
import { Target } from "lucide-react";
import { UomType, MetricDirection } from "@prisma/client";

export function CreateSharedGoalForm() {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    thrustArea: string;
    uomType: UomType;
    metricDirection: MetricDirection;
    targetValue: string;
  }>({
    title: "",
    description: "",
    thrustArea: "Financial",
    uomType: "NUMERIC",
    metricDirection: "HIGHER_IS_BETTER",
    targetValue: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.targetValue) return;

    startTransition(async () => {
      const res = await createSharedGoal({
        ...formData,
        targetValue: parseFloat(formData.targetValue)
      });
      if (res.success) {
        setFormData({
          title: "",
          description: "",
          thrustArea: "Financial",
          uomType: "NUMERIC",
          metricDirection: "HIGHER_IS_BETTER",
          targetValue: ""
        });
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Goal Title</label>
        <input 
          required
          type="text"
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
          placeholder="e.g. Q1 Revenue Target"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Description (Optional)</label>
        <textarea 
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 min-h-[60px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Thrust Area</label>
          <select 
            value={formData.thrustArea}
            onChange={e => setFormData({...formData, thrustArea: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          >
            <option value="Financial">Financial</option>
            <option value="Customer">Customer</option>
            <option value="Internal Process">Internal Process</option>
            <option value="Learning & Growth">Learning & Growth</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">UoM</label>
          <select 
            value={formData.uomType}
            onChange={e => setFormData({...formData, uomType: e.target.value as UomType})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          >
            <option value="NUMERIC">Numeric</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="ZERO_BASED">Zero-Based</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Metric Direction</label>
          <select 
            value={formData.metricDirection}
            onChange={e => setFormData({...formData, metricDirection: e.target.value as MetricDirection})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          >
            <option value="HIGHER_IS_BETTER">Higher is Better (e.g., Revenue)</option>
            <option value="LOWER_IS_BETTER">Lower is Better (e.g., Error Rate)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Master Target</label>
        <input 
          required
          type="number"
          value={formData.targetValue}
          onChange={e => setFormData({...formData, targetValue: e.target.value})}
          placeholder="0"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      <button 
        type="submit"
        disabled={isPending || !formData.title || !formData.targetValue}
        className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-md transition-colors font-medium text-sm flex items-center justify-center gap-2"
      >
        <Target size={16} /> {isPending ? "Creating..." : "Create Master KPI"}
      </button>
    </form>
  );
}
