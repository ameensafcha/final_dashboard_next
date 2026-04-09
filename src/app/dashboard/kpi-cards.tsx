"use client";

import { CheckCircle, Circle, Clock, AlertTriangle } from "lucide-react";

interface KPICardsProps {
  kpis: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

export function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    {
      label: "Total Tasks",
      value: kpis.total,
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
      icon: <Circle className="w-5 h-5" />,
    },
    {
      label: "Completed",
      value: kpis.completed,
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      label: "Pending",
      value: kpis.pending,
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-700",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: "Overdue",
      value: kpis.overdue,
      color: "bg-red-50 border-red-200",
      textColor: "text-red-700",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`p-4 rounded-xl border-2 ${card.color}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={card.textColor}>{card.icon}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {card.label}
            </span>
          </div>
          <p className={`text-2xl font-bold ${card.textColor}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}