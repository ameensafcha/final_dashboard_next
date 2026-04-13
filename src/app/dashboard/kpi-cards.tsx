"use client";

interface KPICardsProps {
  kpis: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

export function KPICards({ kpis }: KPICardsProps) {
  const total = kpis.total > 0 ? kpis.total : 1;
  const completedPct = Math.round((kpis.completed / total) * 100);

  return (
    <div className="flex flex-wrap items-end gap-6 md:gap-8 w-full mb-4">
      
      {/* 1. Dark Pill (Matches "Interviews" style) */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] font-medium text-gray-500">Total Tasks</span>
        <div className="bg-[#1A1A1A] text-white px-5 py-2 rounded-full text-sm font-medium min-w-[64px] text-center shadow-sm">
          {kpis.total}
        </div>
      </div>

      {/* 2. Yellow Pill (Matches "Hired" style) */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] font-medium text-gray-500">In Progress</span>
        <div className="bg-[#E8C547] text-[#1A1A1A] px-5 py-2 rounded-full text-sm font-semibold min-w-[64px] text-center shadow-sm">
          {kpis.pending}
        </div>
      </div>

      {/* 3. Striped Progress Bar (Matches "Project time" style) */}
      <div className="flex flex-col gap-2.5 flex-1 min-w-[200px] max-w-[340px]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-gray-500">Completed</span>
          <span className="text-[13px] font-medium text-gray-400">{completedPct}%</span>
        </div>
        {/* Background of the bar */}
        <div className="h-[36px] w-full bg-white border border-gray-200 rounded-full overflow-hidden flex">
          {/* Striped filled portion */}
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${completedPct}%`,
              backgroundImage: "repeating-linear-gradient(-45deg, #F3F4F6, #F3F4F6 6px, #E5E7EB 6px, #E5E7EB 12px)"
            }}
          />
        </div>
      </div>

      {/* 4. Outline Pill (Matches "Output" style) */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] font-medium text-gray-500">Overdue</span>
        <div className="bg-transparent border border-gray-300 text-gray-600 px-5 py-2 rounded-full text-sm font-medium min-w-[64px] text-center hover:bg-gray-50 transition-colors">
          {kpis.overdue}
        </div>
      </div>

    </div>
  );
}
