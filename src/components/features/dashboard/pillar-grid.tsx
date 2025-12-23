"use client";

import Link from "next/link";
import { PILLARS, type Pillar } from "@/constants/pillars";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PillarGridProps {
  completedPillars: string[];
}

export function PillarGrid({ completedPillars }: PillarGridProps) {
  const totalPillars = PILLARS.length;
  const completedCount = completedPillars.length;

  return (
    <div className="vedic-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Today&apos;s Pillars</h3>
          <p className="text-sm text-gray-500">
            {completedCount} of {totalPillars} completed
          </p>
        </div>
        <div className="text-2xl font-bold text-amber-600">
          {Math.round((completedCount / totalPillars) * 100)}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / totalPillars) * 100}%` }}
        />
      </div>

      {/* Pillar grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {PILLARS.map((pillar) => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            isCompleted={completedPillars.includes(pillar.slug)}
          />
        ))}
      </div>
    </div>
  );
}

interface PillarCardProps {
  pillar: Pillar;
  isCompleted: boolean;
}

function PillarCard({ pillar, isCompleted }: PillarCardProps) {
  const Icon = pillar.icon;

  return (
    <Link
      href={`/pillars/${pillar.slug}`}
      className={cn(
        "group relative p-4 rounded-xl border-2 transition-all duration-200",
        isCompleted
          ? "bg-green-50 border-green-200 hover:border-green-300"
          : "bg-white border-gray-100 hover:border-amber-200 hover:shadow-md"
      )}
    >
      {/* Completion checkmark */}
      {isCompleted && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", pillar.bgColor)}
      >
        <Icon className="w-5 h-5" style={{ color: pillar.color }} />
      </div>

      <h4
        className={cn(
          "text-sm font-medium line-clamp-2",
          isCompleted ? "text-green-700" : "text-gray-900"
        )}
      >
        {pillar.name}
      </h4>

      <p className="text-xs text-gray-500 mt-1">{pillar.sanskritName}</p>

      {/* Karma points indicator */}
      <div
        className={cn(
          "mt-2 text-xs font-medium",
          isCompleted ? "text-green-600" : "text-amber-600"
        )}
      >
        {isCompleted ? "+" : ""}
        {pillar.karmaPointsBase} karma
      </div>
    </Link>
  );
}
