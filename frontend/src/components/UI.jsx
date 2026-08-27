import React from 'react';
import { LeafIcon, RecycleIcon, StarIcon, TrophyIcon, AlertTriangleIcon } from './Icons';

export function StatCard({ title, value, unit = "", subtitle, icon: Icon = LeafIcon, color = "emerald" }) {
  const colorMap = {
    emerald: "from-emerald-500/10 to-teal-500/5 text-emerald-700 border-emerald-200/60",
    teal: "from-teal-500/10 to-emerald-500/5 text-teal-700 border-teal-200/60",
    amber: "from-amber-500/10 to-orange-500/5 text-amber-700 border-amber-200/60",
    blue: "from-blue-500/10 to-indigo-500/5 text-blue-700 border-blue-200/60",
  };

  return (
    <div className={`card relative overflow-hidden bg-gradient-to-br ${colorMap[color] || colorMap.emerald} border transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-eco-secondary">{title}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-eco-text tracking-tight">{value}</span>
            {unit && <span className="text-sm font-semibold text-eco-secondary">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-eco-secondary/80 mt-1.5">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-white/80 backdrop-blur-sm shadow-eco-sm">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export function BinBadge({ category, binColor, size = "md" }) {
  const meta = {
    wet_organic: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-600", label: "Wet / Organic", bin: "Green Bin" },
    dry_recyclable: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", dot: "bg-blue-600", label: "Dry Recyclable", bin: "Blue Bin" },
    hazardous_ewaste: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", dot: "bg-red-600", label: "Hazardous / E-Waste", bin: "Red Bin" },
    reject_other: { bg: "bg-gray-100", text: "text-gray-900", border: "border-gray-300", dot: "bg-gray-900", label: "General / Reject", bin: "Black Bin" },
  }[category] || { bg: "bg-eco-mint", text: "text-eco-forest", border: "border-eco-emerald/20", dot: "bg-eco-emerald", label: category, bin: `${binColor || 'Sorted'} Bin` };

  if (size === "lg") {
    return (
      <div className={`p-4 rounded-2xl ${meta.bg} border-2 ${meta.border} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className={`w-4 h-4 rounded-full ${meta.dot} shadow-sm shrink-0`} />
          <div>
            <p className={`font-bold ${meta.text} text-base`}>{meta.label}</p>
            <p className="text-xs text-eco-secondary">Dispose in the <strong className="underline">{meta.bin}</strong></p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.text} border ${meta.border}`}>
          {meta.bin}
        </span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text} border ${meta.border}`}>
      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
      {meta.label} ({meta.bin})
    </span>
  );
}

export function ConfidenceBar({ confidence }) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * (confidence <= 1 ? 100 : 1));
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-eco-secondary">
        <span>AI Confidence</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-eco-border rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function LevelProgress({ points = 0 }) {
  const level = Math.floor(points / 100) + 1;
  const currentXP = points % 100;
  const title = level > 5 ? "Sustainability Champion" : level > 3 ? "Eco Explorer" : level > 1 ? "Waste Warrior" : "Green Beginner";

  return (
    <div className="eco-card-gradient space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-eco-lime/20 text-eco-forest">
            <TrophyIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-eco-secondary tracking-wider">Level {level}</p>
            <p className="font-extrabold text-eco-forest text-base">{title} 🌱</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-eco-forest text-white text-xs font-bold rounded-full shadow-eco-sm">
          {points} Total XP
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-eco-secondary">
          <span>Progress to Level {level + 1}</span>
          <span>{currentXP} / 100 XP</span>
        </div>
        <div className="w-full bg-eco-border/60 rounded-full h-2.5 p-0.5 overflow-hidden">
          <div className="bg-gradient-to-r from-eco-emerald to-eco-lime h-full rounded-full transition-all duration-500" style={{ width: `${currentXP}%` }} />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = LeafIcon, title, description, actionText, onAction }) {
  return (
    <div className="card text-center py-10 px-6 space-y-4 border-dashed border-2 border-eco-border">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-eco-mint text-eco-forest flex items-center justify-center shadow-eco-sm">
        <Icon className="w-7 h-7" />
      </div>
      <div className="max-w-md mx-auto space-y-1">
        <h3 className="text-lg font-bold text-eco-text">{title}</h3>
        <p className="text-sm text-eco-secondary">{description}</p>
      </div>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "h-8 w-full" }) {
  return (
    <div className={`animate-pulse bg-eco-border/60 rounded-xl ${className}`} />
  );
}
